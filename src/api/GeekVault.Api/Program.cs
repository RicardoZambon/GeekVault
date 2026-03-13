using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GeekVault.Api.Data;
using GeekVault.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy" }))
    .WithName("HealthCheck")
    .WithOpenApi();

app.MapPost("/api/auth/register", async (
    RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    IConfiguration config) =>
{
    var user = new ApplicationUser
    {
        UserName = request.Email,
        Email = request.Email,
        DisplayName = request.DisplayName
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
        return Results.BadRequest(new { errors = result.Errors.Select(e => e.Description) });
    }

    var token = GenerateJwtToken(user, config);
    return Results.Ok(new AuthResponse(token, user.Id, user.Email!, user.DisplayName));
})
.WithName("Register")
.WithOpenApi();

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    UserManager<ApplicationUser> userManager,
    IConfiguration config) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);
    if (user == null || !await userManager.CheckPasswordAsync(user, request.Password))
    {
        return Results.Unauthorized();
    }

    var token = GenerateJwtToken(user, config);
    return Results.Ok(new AuthResponse(token, user.Id, user.Email!, user.DisplayName));
})
.WithName("Login")
.WithOpenApi();

app.MapPost("/api/auth/logout", () =>
{
    // JWT is stateless; client discards the token.
    return Results.Ok(new { message = "Logged out successfully" });
})
.RequireAuthorization()
.WithName("Logout")
.WithOpenApi();

// Protected test endpoint to verify auth works
app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    var email = user.FindFirstValue(ClaimTypes.Email);
    return Results.Ok(new { userId, email });
})
.RequireAuthorization()
.WithName("Me")
.WithOpenApi();

// Profile endpoints
app.MapGet("/api/profile", async (
    ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    var user = await userManager.FindByIdAsync(userId!);
    if (user == null) return Results.NotFound();

    return Results.Ok(new ProfileResponse(
        user.Id, user.Email!, user.DisplayName, user.Avatar, user.Bio,
        user.PreferredLanguage, user.PreferredCurrency));
})
.RequireAuthorization()
.WithName("GetProfile")
.WithOpenApi();

app.MapPut("/api/profile", async (
    UpdateProfileRequest request,
    ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    var user = await userManager.FindByIdAsync(userId!);
    if (user == null) return Results.NotFound();

    user.DisplayName = request.DisplayName;
    user.Bio = request.Bio;
    user.PreferredLanguage = request.PreferredLanguage;
    user.PreferredCurrency = request.PreferredCurrency;

    var result = await userManager.UpdateAsync(user);
    if (!result.Succeeded)
        return Results.BadRequest(new { errors = result.Errors.Select(e => e.Description) });

    return Results.Ok(new ProfileResponse(
        user.Id, user.Email!, user.DisplayName, user.Avatar, user.Bio,
        user.PreferredLanguage, user.PreferredCurrency));
})
.RequireAuthorization()
.WithName("UpdateProfile")
.WithOpenApi();

app.MapPost("/api/profile/avatar", async (
    HttpRequest httpRequest,
    ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager,
    IWebHostEnvironment env) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    var user = await userManager.FindByIdAsync(userId!);
    if (user == null) return Results.NotFound();

    if (!httpRequest.HasFormContentType)
        return Results.BadRequest(new { error = "Expected multipart form data" });

    var form = await httpRequest.ReadFormAsync();
    var file = form.Files.GetFile("avatar");
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No avatar file provided" });

    var uploadsDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
    Directory.CreateDirectory(uploadsDir);

    var extension = Path.GetExtension(file.FileName);
    var fileName = $"{userId}{extension}";
    var filePath = Path.Combine(uploadsDir, fileName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    user.Avatar = $"/uploads/{fileName}";
    await userManager.UpdateAsync(user);

    return Results.Ok(new { avatarUrl = user.Avatar });
})
.RequireAuthorization()
.WithName("UploadAvatar")
.WithOpenApi()
.DisableAntiforgery();

// CollectionType endpoints
var validFieldTypes = new HashSet<string> { "text", "number", "date", "enum", "boolean", "image_url" };

app.MapGet("/api/collection-types", async (
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var types = await db.CollectionTypes
        .Where(ct => ct.UserId == userId)
        .Select(ct => new CollectionTypeResponse(ct.Id, ct.Name, ct.Description, ct.Icon,
            ct.CustomFieldSchema.Select(f => new CustomFieldDto(f.Name, f.Type, f.Required, f.Options)).ToList()))
        .ToListAsync();
    return Results.Ok(types);
})
.RequireAuthorization()
.WithName("ListCollectionTypes")
.WithOpenApi();

app.MapGet("/api/collection-types/{id:int}", async (
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var ct = await db.CollectionTypes.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (ct == null) return Results.NotFound();

    return Results.Ok(new CollectionTypeResponse(ct.Id, ct.Name, ct.Description, ct.Icon,
        ct.CustomFieldSchema.Select(f => new CustomFieldDto(f.Name, f.Type, f.Required, f.Options)).ToList()));
})
.RequireAuthorization()
.WithName("GetCollectionType")
.WithOpenApi();

app.MapPost("/api/collection-types", async (
    CreateCollectionTypeRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

    if (request.CustomFields != null && request.CustomFields.Count > 10)
        return Results.BadRequest(new { error = "Maximum of 10 custom fields allowed" });

    if (request.CustomFields != null && request.CustomFields.Any(f => !validFieldTypes.Contains(f.Type)))
        return Results.BadRequest(new { error = $"Invalid field type. Supported types: {string.Join(", ", validFieldTypes)}" });

    var ct = new CollectionType
    {
        UserId = userId,
        Name = request.Name,
        Description = request.Description,
        Icon = request.Icon,
        CustomFieldSchema = request.CustomFields?.Select(f => new CustomFieldDefinition
        {
            Name = f.Name,
            Type = f.Type,
            Required = f.Required,
            Options = f.Options
        }).ToList() ?? new()
    };

    db.CollectionTypes.Add(ct);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collection-types/{ct.Id}",
        new CollectionTypeResponse(ct.Id, ct.Name, ct.Description, ct.Icon,
            ct.CustomFieldSchema.Select(f => new CustomFieldDto(f.Name, f.Type, f.Required, f.Options)).ToList()));
})
.RequireAuthorization()
.WithName("CreateCollectionType")
.WithOpenApi();

app.MapPut("/api/collection-types/{id:int}", async (
    int id,
    UpdateCollectionTypeRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var ct = await db.CollectionTypes.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (ct == null) return Results.NotFound();

    if (request.CustomFields != null && request.CustomFields.Count > 10)
        return Results.BadRequest(new { error = "Maximum of 10 custom fields allowed" });

    if (request.CustomFields != null && request.CustomFields.Any(f => !validFieldTypes.Contains(f.Type)))
        return Results.BadRequest(new { error = $"Invalid field type. Supported types: {string.Join(", ", validFieldTypes)}" });

    ct.Name = request.Name ?? ct.Name;
    ct.Description = request.Description;
    ct.Icon = request.Icon;
    if (request.CustomFields != null)
    {
        ct.CustomFieldSchema = request.CustomFields.Select(f => new CustomFieldDefinition
        {
            Name = f.Name,
            Type = f.Type,
            Required = f.Required,
            Options = f.Options
        }).ToList();
    }

    await db.SaveChangesAsync();

    return Results.Ok(new CollectionTypeResponse(ct.Id, ct.Name, ct.Description, ct.Icon,
        ct.CustomFieldSchema.Select(f => new CustomFieldDto(f.Name, f.Type, f.Required, f.Options)).ToList()));
})
.RequireAuthorization()
.WithName("UpdateCollectionType")
.WithOpenApi();

app.MapDelete("/api/collection-types/{id:int}", async (
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var ct = await db.CollectionTypes.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (ct == null) return Results.NotFound();

    db.CollectionTypes.Remove(ct);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteCollectionType")
.WithOpenApi();

// Collection endpoints
app.MapGet("/api/collections", async (
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collections = await db.Collections
        .Where(c => c.UserId == userId)
        .Select(c => new CollectionResponse(c.Id, c.Name, c.Description, c.CoverImage,
            c.Visibility.ToString(), c.CollectionTypeId,
            db.CatalogItems.Count(ci => ci.CollectionId == c.Id)))
        .ToListAsync();
    return Results.Ok(collections);
})
.RequireAuthorization()
.WithName("ListCollections")
.WithOpenApi();

app.MapGet("/api/collections/{id:int}", async (
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var c = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (c == null) return Results.NotFound();

    var itemCount = await db.CatalogItems.CountAsync(ci => ci.CollectionId == c.Id);
    return Results.Ok(new CollectionResponse(c.Id, c.Name, c.Description, c.CoverImage,
        c.Visibility.ToString(), c.CollectionTypeId, itemCount));
})
.RequireAuthorization()
.WithName("GetCollection")
.WithOpenApi();

app.MapPost("/api/collections", async (
    CreateCollectionRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

    if (!Enum.TryParse<Visibility>(request.Visibility, true, out var visibility))
        visibility = Visibility.Private;

    var collection = new Collection
    {
        UserId = userId,
        CollectionTypeId = request.CollectionTypeId,
        Name = request.Name,
        Description = request.Description,
        Visibility = visibility
    };

    db.Collections.Add(collection);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collection.Id}",
        new CollectionResponse(collection.Id, collection.Name, collection.Description, collection.CoverImage,
            collection.Visibility.ToString(), collection.CollectionTypeId, 0));
})
.RequireAuthorization()
.WithName("CreateCollection")
.WithOpenApi();

app.MapPut("/api/collections/{id:int}", async (
    int id,
    UpdateCollectionRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    collection.Name = request.Name ?? collection.Name;
    collection.Description = request.Description;
    if (request.Visibility != null && Enum.TryParse<Visibility>(request.Visibility, true, out var vis))
        collection.Visibility = vis;

    await db.SaveChangesAsync();

    var itemCount = await db.CatalogItems.CountAsync(ci => ci.CollectionId == collection.Id);
    return Results.Ok(new CollectionResponse(collection.Id, collection.Name, collection.Description,
        collection.CoverImage, collection.Visibility.ToString(), collection.CollectionTypeId, itemCount));
})
.RequireAuthorization()
.WithName("UpdateCollection")
.WithOpenApi();

app.MapDelete("/api/collections/{id:int}", async (
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    db.Collections.Remove(collection);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteCollection")
.WithOpenApi();

app.MapPost("/api/collections/{id:int}/cover", async (
    int id,
    HttpRequest httpRequest,
    ClaimsPrincipal principal,
    ApplicationDbContext db,
    IWebHostEnvironment env) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    if (!httpRequest.HasFormContentType)
        return Results.BadRequest(new { error = "Expected multipart form data" });

    var form = await httpRequest.ReadFormAsync();
    var file = form.Files.GetFile("cover");
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No cover file provided" });

    var uploadsDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
    Directory.CreateDirectory(uploadsDir);

    var extension = Path.GetExtension(file.FileName);
    var fileName = $"collection-{id}{extension}";
    var filePath = Path.Combine(uploadsDir, fileName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    collection.CoverImage = $"/uploads/{fileName}";
    await db.SaveChangesAsync();

    return Results.Ok(new { coverUrl = collection.CoverImage });
})
.RequireAuthorization()
.WithName("UploadCollectionCover")
.WithOpenApi()
.DisableAntiforgery();

// CatalogItem endpoints
app.MapGet("/api/collections/{collectionId:int}/items", async (
    int collectionId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var items = await db.CatalogItems
        .Where(i => i.CollectionId == collectionId)
        .Select(i => new CatalogItemResponse(i.Id, i.CollectionId, i.Identifier, i.Name, i.Description,
            i.ReleaseDate, i.Manufacturer, i.ReferenceCode, i.Image, i.Rarity,
            i.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            null))
        .ToListAsync();
    return Results.Ok(items);
})
.RequireAuthorization()
.WithName("ListCatalogItems")
.WithOpenApi();

app.MapGet("/api/collections/{collectionId:int}/items/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    var ownedCopies = await db.OwnedCopies
        .Where(oc => oc.CatalogItemId == id)
        .Select(oc => new OwnedCopyDto(oc.Id, oc.Condition.ToString(), oc.PurchasePrice, oc.EstimatedValue,
            oc.AcquisitionDate, oc.AcquisitionSource, oc.Notes))
        .ToListAsync();

    return Results.Ok(new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name,
        item.Description, item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
        item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
        ownedCopies));
})
.RequireAuthorization()
.WithName("GetCatalogItem")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/items", async (
    int collectionId,
    CreateCatalogItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
        .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    // Validate custom field values against schema
    if (request.CustomFieldValues != null && request.CustomFieldValues.Count > 0)
    {
        var schema = collection.CollectionType.CustomFieldSchema;
        foreach (var fv in request.CustomFieldValues)
        {
            var fieldDef = schema.FirstOrDefault(f => f.Name == fv.Name);
            if (fieldDef == null)
                return Results.BadRequest(new { error = $"Unknown custom field: {fv.Name}" });
        }
        // Check required fields
        foreach (var field in schema.Where(f => f.Required))
        {
            if (!request.CustomFieldValues.Any(fv => fv.Name == field.Name && !string.IsNullOrEmpty(fv.Value)))
                return Results.BadRequest(new { error = $"Required custom field missing: {field.Name}" });
        }
    }

    var item = new CatalogItem
    {
        CollectionId = collectionId,
        Identifier = request.Identifier,
        Name = request.Name,
        Description = request.Description,
        ReleaseDate = request.ReleaseDate,
        Manufacturer = request.Manufacturer,
        ReferenceCode = request.ReferenceCode,
        Image = request.Image,
        Rarity = request.Rarity,
        CustomFieldValues = request.CustomFieldValues?.Select(f => new CustomFieldValue
        {
            Name = f.Name,
            Value = f.Value
        }).ToList() ?? new()
    };

    db.CatalogItems.Add(item);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collectionId}/items/{item.Id}",
        new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name, item.Description,
            item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
            item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            null));
})
.RequireAuthorization()
.WithName("CreateCatalogItem")
.WithOpenApi();

app.MapPut("/api/collections/{collectionId:int}/items/{id:int}", async (
    int collectionId,
    int id,
    UpdateCatalogItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
        .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    // Validate custom field values against schema
    if (request.CustomFieldValues != null && request.CustomFieldValues.Count > 0)
    {
        var schema = collection.CollectionType.CustomFieldSchema;
        foreach (var fv in request.CustomFieldValues)
        {
            var fieldDef = schema.FirstOrDefault(f => f.Name == fv.Name);
            if (fieldDef == null)
                return Results.BadRequest(new { error = $"Unknown custom field: {fv.Name}" });
        }
    }

    item.Name = request.Name ?? item.Name;
    item.Identifier = request.Identifier ?? item.Identifier;
    item.Description = request.Description;
    item.ReleaseDate = request.ReleaseDate;
    item.Manufacturer = request.Manufacturer;
    item.ReferenceCode = request.ReferenceCode;
    item.Image = request.Image;
    item.Rarity = request.Rarity;
    if (request.CustomFieldValues != null)
    {
        item.CustomFieldValues = request.CustomFieldValues.Select(f => new CustomFieldValue
        {
            Name = f.Name,
            Value = f.Value
        }).ToList();
    }

    await db.SaveChangesAsync();

    return Results.Ok(new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name,
        item.Description, item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
        item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
        null));
})
.RequireAuthorization()
.WithName("UpdateCatalogItem")
.WithOpenApi();

app.MapDelete("/api/collections/{collectionId:int}/items/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    db.CatalogItems.Remove(item);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteCatalogItem")
.WithOpenApi();

// OwnedCopy endpoints
app.MapGet("/api/items/{catalogItemId:int}/copies", async (
    int catalogItemId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var item = await db.CatalogItems
        .Include(i => i.Collection)
        .FirstOrDefaultAsync(i => i.Id == catalogItemId && i.Collection.UserId == userId);
    if (item == null) return Results.NotFound();

    var copies = await db.OwnedCopies
        .Where(oc => oc.CatalogItemId == catalogItemId)
        .Select(oc => new OwnedCopyResponse(oc.Id, oc.CatalogItemId, oc.Condition.ToString(),
            oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource, oc.Notes,
            oc.Images.Select(img => img.Url).ToList()))
        .ToListAsync();
    return Results.Ok(copies);
})
.RequireAuthorization()
.WithName("ListOwnedCopies")
.WithOpenApi();

app.MapPost("/api/items/{catalogItemId:int}/copies", async (
    int catalogItemId,
    CreateOwnedCopyRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var item = await db.CatalogItems
        .Include(i => i.Collection)
        .FirstOrDefaultAsync(i => i.Id == catalogItemId && i.Collection.UserId == userId);
    if (item == null) return Results.NotFound();

    if (!Enum.TryParse<Condition>(request.Condition, true, out var condition))
        return Results.BadRequest(new { error = $"Invalid condition. Valid values: {string.Join(", ", Enum.GetNames<Condition>())}" });

    var copy = new OwnedCopy
    {
        CatalogItemId = catalogItemId,
        Condition = condition,
        PurchasePrice = request.PurchasePrice,
        EstimatedValue = request.EstimatedValue,
        AcquisitionDate = request.AcquisitionDate,
        AcquisitionSource = request.AcquisitionSource,
        Notes = request.Notes,
        Images = request.Images?.Select(url => new OwnedCopyImage { Url = url }).ToList() ?? new()
    };

    db.OwnedCopies.Add(copy);
    await db.SaveChangesAsync();

    return Results.Created($"/api/items/{catalogItemId}/copies/{copy.Id}",
        new OwnedCopyResponse(copy.Id, copy.CatalogItemId, copy.Condition.ToString(),
            copy.PurchasePrice, copy.EstimatedValue, copy.AcquisitionDate, copy.AcquisitionSource, copy.Notes,
            copy.Images.Select(img => img.Url).ToList()));
})
.RequireAuthorization()
.WithName("CreateOwnedCopy")
.WithOpenApi();

app.MapPut("/api/items/{catalogItemId:int}/copies/{id:int}", async (
    int catalogItemId,
    int id,
    UpdateOwnedCopyRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var item = await db.CatalogItems
        .Include(i => i.Collection)
        .FirstOrDefaultAsync(i => i.Id == catalogItemId && i.Collection.UserId == userId);
    if (item == null) return Results.NotFound();

    var copy = await db.OwnedCopies.FirstOrDefaultAsync(oc => oc.Id == id && oc.CatalogItemId == catalogItemId);
    if (copy == null) return Results.NotFound();

    if (request.Condition != null)
    {
        if (!Enum.TryParse<Condition>(request.Condition, true, out var condition))
            return Results.BadRequest(new { error = $"Invalid condition. Valid values: {string.Join(", ", Enum.GetNames<Condition>())}" });
        copy.Condition = condition;
    }

    copy.PurchasePrice = request.PurchasePrice;
    copy.EstimatedValue = request.EstimatedValue;
    copy.AcquisitionDate = request.AcquisitionDate;
    copy.AcquisitionSource = request.AcquisitionSource;
    copy.Notes = request.Notes;
    if (request.Images != null)
        copy.Images = request.Images.Select(url => new OwnedCopyImage { Url = url }).ToList();

    await db.SaveChangesAsync();

    return Results.Ok(new OwnedCopyResponse(copy.Id, copy.CatalogItemId, copy.Condition.ToString(),
        copy.PurchasePrice, copy.EstimatedValue, copy.AcquisitionDate, copy.AcquisitionSource, copy.Notes,
        copy.Images.Select(img => img.Url).ToList()));
})
.RequireAuthorization()
.WithName("UpdateOwnedCopy")
.WithOpenApi();

app.MapDelete("/api/items/{catalogItemId:int}/copies/{id:int}", async (
    int catalogItemId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var item = await db.CatalogItems
        .Include(i => i.Collection)
        .FirstOrDefaultAsync(i => i.Id == catalogItemId && i.Collection.UserId == userId);
    if (item == null) return Results.NotFound();

    var copy = await db.OwnedCopies.FirstOrDefaultAsync(oc => oc.Id == id && oc.CatalogItemId == catalogItemId);
    if (copy == null) return Results.NotFound();

    db.OwnedCopies.Remove(copy);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteOwnedCopy")
.WithOpenApi();

app.Run();

static string GenerateJwtToken(ApplicationUser user, IConfiguration config)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expires = DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:ExpiresInMinutes"]!));

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email!),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var token = new JwtSecurityToken(
        issuer: config["Jwt:Issuer"],
        audience: config["Jwt:Audience"],
        claims: claims,
        expires: expires,
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}

// Request/Response records
record RegisterRequest(string Email, string Password, string? DisplayName);
record LoginRequest(string Email, string Password);
record AuthResponse(string Token, string UserId, string Email, string? DisplayName);
record UpdateProfileRequest(string? DisplayName, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
record ProfileResponse(string Id, string Email, string? DisplayName, string? Avatar, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
record CustomFieldDto(string Name, string Type, bool Required, List<string>? Options);
record CreateCollectionTypeRequest(string Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
record UpdateCollectionTypeRequest(string? Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
record CollectionTypeResponse(int Id, string Name, string? Description, string? Icon, List<CustomFieldDto> CustomFields);
record CreateCollectionRequest(string Name, string? Description, int CollectionTypeId, string? Visibility);
record UpdateCollectionRequest(string? Name, string? Description, string? Visibility);
record CollectionResponse(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, int ItemCount);
record CustomFieldValueDto(string Name, string Value);
record CreateCatalogItemRequest(string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
record UpdateCatalogItemRequest(string? Identifier, string? Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
record OwnedCopyDto(int Id, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes);
record CatalogItemResponse(int Id, int CollectionId, string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFieldValues, List<OwnedCopyDto>? OwnedCopies);
record CreateOwnedCopyRequest(string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string>? Images);
record UpdateOwnedCopyRequest(string? Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string>? Images);
record OwnedCopyResponse(int Id, int CatalogItemId, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string> Images);
