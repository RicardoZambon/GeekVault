using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GeekVault.Api.Data;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Entities.Vault;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsHistoryTable("MigrationsHistory", "EF")));

builder.Services.AddIdentityCore<User>()
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
    UserManager<User> userManager,
    IConfiguration config) =>
{
    var user = new User
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
    UserManager<User> userManager,
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
    UserManager<User> userManager) =>
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
    UserManager<User> userManager) =>
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
    UserManager<User> userManager,
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
    ApplicationDbContext db,
    string? search,
    string? condition,
    string? ownedStatus,
    string? sortBy,
    string? sortDir,
    int? page,
    int? pageSize) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var query = db.CatalogItems.Where(i => i.CollectionId == collectionId).AsQueryable();

    // Search by name or description
    if (!string.IsNullOrWhiteSpace(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(i => i.Name.ToLower().Contains(searchLower) ||
            (i.Description != null && i.Description.ToLower().Contains(searchLower)));
    }

    // Filter by condition (items that have at least one owned copy with that condition)
    if (!string.IsNullOrWhiteSpace(condition) && Enum.TryParse<Condition>(condition, true, out var conditionEnum))
    {
        query = query.Where(i => db.OwnedCopies.Any(oc => oc.CatalogItemId == i.Id && oc.Condition == conditionEnum));
    }

    // Filter by owned status
    if (!string.IsNullOrWhiteSpace(ownedStatus))
    {
        if (ownedStatus.Equals("owned", StringComparison.OrdinalIgnoreCase))
            query = query.Where(i => db.OwnedCopies.Any(oc => oc.CatalogItemId == i.Id));
        else if (ownedStatus.Equals("unowned", StringComparison.OrdinalIgnoreCase))
            query = query.Where(i => !db.OwnedCopies.Any(oc => oc.CatalogItemId == i.Id));
    }

    var totalCount = await query.CountAsync();

    // Sort
    var isDesc = sortDir?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;
    query = (sortBy?.ToLower()) switch
    {
        "name" => isDesc ? query.OrderByDescending(i => i.Name) : query.OrderBy(i => i.Name),
        "date" => isDesc ? query.OrderByDescending(i => i.ReleaseDate) : query.OrderBy(i => i.ReleaseDate),
        "rarity" => isDesc ? query.OrderByDescending(i => i.Rarity) : query.OrderBy(i => i.Rarity),
        _ => query.OrderBy(i => i.Id)
    };

    // Pagination
    var currentPage = page ?? 1;
    var currentPageSize = pageSize ?? 20;
    if (currentPage < 1) currentPage = 1;
    if (currentPageSize < 1) currentPageSize = 1;
    if (currentPageSize > 100) currentPageSize = 100;

    query = query.Skip((currentPage - 1) * currentPageSize).Take(currentPageSize);

    var items = await query
        .Select(i => new CatalogItemResponse(i.Id, i.CollectionId, i.Identifier, i.Name, i.Description,
            i.ReleaseDate, i.Manufacturer, i.ReferenceCode, i.Image, i.Rarity,
            i.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            null))
        .ToListAsync();

    return Results.Ok(new PaginatedResponse<CatalogItemResponse>(items, totalCount, currentPage, currentPageSize));
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

// Set endpoints
app.MapGet("/api/collections/{collectionId:int}/sets", async (
    int collectionId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var sets = await db.Sets
        .Where(s => s.CollectionId == collectionId)
        .Select(s => new SetResponse(s.Id, s.CollectionId, s.Name, s.ExpectedItemCount, null, null, null))
        .ToListAsync();
    return Results.Ok(sets);
})
.RequireAuthorization()
.WithName("ListSets")
.WithOpenApi();

app.MapGet("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    var items = await db.SetItems
        .Where(si => si.SetId == id)
        .OrderBy(si => si.SortOrder)
        .Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder))
        .ToListAsync();

    // Calculate completion: a set item is complete if its linked CatalogItem has at least one OwnedCopy
    var completedCount = 0;
    foreach (var item in items)
    {
        if (item.CatalogItemId != null)
        {
            var hasOwnedCopy = await db.OwnedCopies.AnyAsync(oc => oc.CatalogItemId == item.CatalogItemId);
            if (hasOwnedCopy) completedCount++;
        }
    }
    var completionPercentage = set.ExpectedItemCount > 0
        ? (double)completedCount / set.ExpectedItemCount * 100
        : 0;

    return Results.Ok(new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount,
        items, completedCount, Math.Round(completionPercentage, 2)));
})
.RequireAuthorization()
.WithName("GetSet")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/sets", async (
    int collectionId,
    CreateSetRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = new Set
    {
        CollectionId = collectionId,
        Name = request.Name,
        ExpectedItemCount = request.ExpectedItemCount
    };

    db.Sets.Add(set);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collectionId}/sets/{set.Id}",
        new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null));
})
.RequireAuthorization()
.WithName("CreateSet")
.WithOpenApi();

app.MapPut("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    UpdateSetRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    set.Name = request.Name ?? set.Name;
    if (request.ExpectedItemCount.HasValue)
        set.ExpectedItemCount = request.ExpectedItemCount.Value;

    await db.SaveChangesAsync();

    return Results.Ok(new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null));
})
.RequireAuthorization()
.WithName("UpdateSet")
.WithOpenApi();

app.MapDelete("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    db.Sets.Remove(set);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteSet")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/sets/{id:int}/items", async (
    int collectionId,
    int id,
    List<CreateSetItemRequest> request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    var maxSortOrder = await db.SetItems
        .Where(si => si.SetId == id)
        .Select(si => (int?)si.SortOrder)
        .MaxAsync() ?? 0;

    var items = new List<SetItem>();
    foreach (var itemReq in request)
    {
        maxSortOrder++;
        var setItem = new SetItem
        {
            SetId = id,
            CatalogItemId = itemReq.CatalogItemId,
            Name = itemReq.Name,
            SortOrder = itemReq.SortOrder ?? maxSortOrder
        };
        items.Add(setItem);
        db.SetItems.Add(setItem);
    }

    await db.SaveChangesAsync();

    var response = items.Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder)).ToList();
    return Results.Created($"/api/collections/{collectionId}/sets/{id}/items", response);
})
.RequireAuthorization()
.WithName("AddSetItems")
.WithOpenApi();

// Wishlist endpoints
app.MapGet("/api/collections/{collectionId:int}/wishlist", async (
    int collectionId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var items = await db.WishlistItems
        .Where(w => w.CollectionId == collectionId)
        .OrderBy(w => w.Priority)
        .Select(w => new WishlistItemResponse(w.Id, w.CollectionId, w.CatalogItemId, w.Name, w.Priority, w.TargetPrice, w.Notes))
        .ToListAsync();
    return Results.Ok(items);
})
.RequireAuthorization()
.WithName("ListWishlistItems")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/wishlist", async (
    int collectionId,
    CreateWishlistItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = new WishlistItem
    {
        CollectionId = collectionId,
        CatalogItemId = request.CatalogItemId,
        Name = request.Name,
        Priority = request.Priority,
        TargetPrice = request.TargetPrice,
        Notes = request.Notes
    };

    db.WishlistItems.Add(item);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collectionId}/wishlist/{item.Id}",
        new WishlistItemResponse(item.Id, item.CollectionId, item.CatalogItemId, item.Name, item.Priority, item.TargetPrice, item.Notes));
})
.RequireAuthorization()
.WithName("CreateWishlistItem")
.WithOpenApi();

app.MapPut("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
    int collectionId,
    int id,
    UpdateWishlistItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    item.Name = request.Name ?? item.Name;
    item.CatalogItemId = request.CatalogItemId;
    if (request.Priority.HasValue)
        item.Priority = request.Priority.Value;
    item.TargetPrice = request.TargetPrice;
    item.Notes = request.Notes;

    await db.SaveChangesAsync();

    return Results.Ok(new WishlistItemResponse(item.Id, item.CollectionId, item.CatalogItemId, item.Name, item.Priority, item.TargetPrice, item.Notes));
})
.RequireAuthorization()
.WithName("UpdateWishlistItem")
.WithOpenApi();

app.MapDelete("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    db.WishlistItems.Remove(item);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteWishlistItem")
.WithOpenApi();

// Dashboard analytics
app.MapGet("/api/dashboard", async (ClaimsPrincipal principal, ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

    var userCollections = await db.Collections
        .Where(c => c.UserId == userId)
        .Select(c => new
        {
            c.Id,
            c.Name,
            ItemCount = db.CatalogItems.Count(ci => ci.CollectionId == c.Id),
            OwnedCount = db.OwnedCopies.Count(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id)),
            Value = db.OwnedCopies
                .Where(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                .Sum(oc => (decimal?)oc.EstimatedValue ?? 0m),
            Invested = db.OwnedCopies
                .Where(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                .Sum(oc => (decimal?)oc.PurchasePrice ?? 0m)
        })
        .ToListAsync();

    var totalCollections = userCollections.Count;
    var totalItems = userCollections.Sum(c => c.ItemCount);
    var totalOwnedCopies = userCollections.Sum(c => c.OwnedCount);
    var totalEstimatedValue = userCollections.Sum(c => c.Value);
    var totalInvested = userCollections.Sum(c => c.Invested);

    var collectionSummaries = userCollections.Select(c =>
        new CollectionSummaryDto(c.Id, c.Name, c.ItemCount, c.OwnedCount, c.Value)).ToList();

    // Items by condition
    var userCatalogItemIds = db.CatalogItems
        .Where(ci => db.Collections.Any(c => c.Id == ci.CollectionId && c.UserId == userId))
        .Select(ci => ci.Id);

    var itemsByCondition = await db.OwnedCopies
        .Where(oc => userCatalogItemIds.Contains(oc.CatalogItemId))
        .GroupBy(oc => oc.Condition)
        .Select(g => new ConditionCountDto(g.Key.ToString(), g.Count()))
        .ToListAsync();

    // Recent acquisitions (last 10)
    var recentAcquisitions = await db.OwnedCopies
        .Where(oc => userCatalogItemIds.Contains(oc.CatalogItemId))
        .OrderByDescending(oc => oc.AcquisitionDate)
        .ThenByDescending(oc => oc.Id)
        .Take(10)
        .Join(db.CatalogItems, oc => oc.CatalogItemId, ci => ci.Id, (oc, ci) => new RecentAcquisitionDto(
            oc.Id, ci.Name, oc.Condition.ToString(), oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource))
        .ToListAsync();

    return Results.Ok(new DashboardResponse(
        totalCollections, totalItems, totalOwnedCopies, totalEstimatedValue, totalInvested,
        itemsByCondition, collectionSummaries, recentAcquisitions));
})
.RequireAuthorization()
.WithName("GetDashboard")
.WithOpenApi();

// Export endpoints
app.MapGet("/api/collections/{id:int}/export", async (
    int id,
    string? format,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var items = await db.CatalogItems
        .Where(ci => ci.CollectionId == id)
        .Include(ci => ci.CustomFieldValues)
        .ToListAsync();

    var ownedCopies = await db.OwnedCopies
        .Where(oc => items.Select(i => i.Id).Contains(oc.CatalogItemId))
        .Include(oc => oc.Images)
        .ToListAsync();

    var exportFormat = (format ?? "json").ToLowerInvariant();

    if (exportFormat == "csv")
    {
        var sb = new StringBuilder();
        // Header
        sb.AppendLine("Id,Identifier,Name,Description,ReleaseDate,Manufacturer,ReferenceCode,Image,Rarity,CustomFields,CopyId,Condition,PurchasePrice,EstimatedValue,AcquisitionDate,AcquisitionSource,Notes");

        foreach (var item in items)
        {
            var copies = ownedCopies.Where(oc => oc.CatalogItemId == item.Id).ToList();
            var customFields = item.CustomFieldValues?.Any() == true
                ? string.Join("; ", item.CustomFieldValues.Select(cf => $"{cf.Name}={cf.Value}"))
                : "";

            if (copies.Count == 0)
            {
                sb.AppendLine($"{item.Id},{CsvEscape(item.Identifier)},{CsvEscape(item.Name)},{CsvEscape(item.Description)},{item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(item.Manufacturer)},{CsvEscape(item.ReferenceCode)},{CsvEscape(item.Image)},{CsvEscape(item.Rarity)},{CsvEscape(customFields)},,,,,,");
            }
            else
            {
                foreach (var copy in copies)
                {
                    sb.AppendLine($"{item.Id},{CsvEscape(item.Identifier)},{CsvEscape(item.Name)},{CsvEscape(item.Description)},{item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(item.Manufacturer)},{CsvEscape(item.ReferenceCode)},{CsvEscape(item.Image)},{CsvEscape(item.Rarity)},{CsvEscape(customFields)},{copy.Id},{copy.Condition},{copy.PurchasePrice?.ToString(CultureInfo.InvariantCulture)},{copy.EstimatedValue?.ToString(CultureInfo.InvariantCulture)},{copy.AcquisitionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(copy.AcquisitionSource)},{CsvEscape(copy.Notes)}");
                }
            }
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", $"{collection.Name}_export.csv");
    }
    else if (exportFormat == "json")
    {
        var exportData = items.Select(item => new
        {
            item.Id,
            item.Identifier,
            item.Name,
            item.Description,
            ReleaseDate = item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            item.Manufacturer,
            item.ReferenceCode,
            item.Image,
            item.Rarity,
            CustomFields = item.CustomFieldValues?.Select(cf => new { cf.Name, cf.Value }).ToList(),
            OwnedCopies = ownedCopies.Where(oc => oc.CatalogItemId == item.Id).Select(oc => new
            {
                oc.Id,
                Condition = oc.Condition.ToString(),
                oc.PurchasePrice,
                oc.EstimatedValue,
                AcquisitionDate = oc.AcquisitionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                oc.AcquisitionSource,
                oc.Notes,
                Images = oc.Images?.Select(img => img.Url).ToList()
            }).ToList()
        }).ToList();

        var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(exportData, new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return Results.File(jsonBytes, "application/json", $"{collection.Name}_export.json");
    }
    else
    {
        return Results.BadRequest(new { error = "Unsupported format. Use 'csv' or 'json'." });
    }
})
.RequireAuthorization()
.WithName("ExportCollection")
.WithOpenApi();

// Import endpoints
var importPreviews = new Dictionary<string, List<ImportRowDto>>();

app.MapPost("/api/collections/{id:int}/import/preview", async (
    int id,
    HttpRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
            .ThenInclude(ct => ct.CustomFieldSchema)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var form = await request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No CSV file provided." });

    var schema = collection.CollectionType.CustomFieldSchema;
    var rows = await ParseCsvFile(file, schema);

    var previewId = Guid.NewGuid().ToString();
    importPreviews[previewId] = rows;

    var hasErrors = rows.Any(r => r.Errors.Count > 0);
    return Results.Ok(new ImportPreviewResponse(previewId, rows.Count, rows.Count(r => r.Errors.Count == 0), rows.Count(r => r.Errors.Count > 0), hasErrors, rows));
})
.RequireAuthorization()
.DisableAntiforgery()
.WithName("ImportPreview")
.WithOpenApi();

app.MapPost("/api/collections/{id:int}/import/confirm", async (
    int id,
    ImportConfirmRequest confirmRequest,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    if (!importPreviews.TryGetValue(confirmRequest.PreviewId, out var rows))
        return Results.BadRequest(new { error = "Preview not found or expired." });

    importPreviews.Remove(confirmRequest.PreviewId);

    var validRows = rows.Where(r => r.Errors.Count == 0).ToList();
    var imported = 0;

    foreach (var row in validRows)
    {
        var item = new CatalogItem
        {
            CollectionId = id,
            Identifier = row.Identifier ?? "",
            Name = row.Name ?? "",
            Description = row.Description,
            Manufacturer = row.Manufacturer,
            ReferenceCode = row.ReferenceCode,
            Image = row.Image,
            Rarity = row.Rarity,
            CustomFieldValues = row.CustomFields?.Select(cf => new CustomFieldValue { Name = cf.Name, Value = cf.Value }).ToList() ?? new()
        };
        if (DateTime.TryParse(row.ReleaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var releaseDate))
            item.ReleaseDate = releaseDate;

        db.CatalogItems.Add(item);
        imported++;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new ImportConfirmResponse(imported, rows.Count - imported));
})
.RequireAuthorization()
.WithName("ImportConfirm")
.WithOpenApi();

app.MapPost("/api/collections/{id:int}/import", async (
    int id,
    HttpRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
            .ThenInclude(ct => ct.CustomFieldSchema)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    IFormFile? file = null;
    try
    {
        var form = await request.ReadFormAsync();
        file = form.Files.FirstOrDefault();
    }
    catch { }
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No CSV file provided." });

    var schema = collection.CollectionType.CustomFieldSchema;
    var rows = await ParseCsvFile(file, schema);

    var validRows = rows.Where(r => r.Errors.Count == 0).ToList();
    var imported = 0;
    var rowErrors = rows.Where(r => r.Errors.Count > 0).ToList();

    foreach (var row in validRows)
    {
        var item = new CatalogItem
        {
            CollectionId = id,
            Identifier = row.Identifier ?? "",
            Name = row.Name ?? "",
            Description = row.Description,
            Manufacturer = row.Manufacturer,
            ReferenceCode = row.ReferenceCode,
            Image = row.Image,
            Rarity = row.Rarity,
            CustomFieldValues = row.CustomFields?.Select(cf => new CustomFieldValue { Name = cf.Name, Value = cf.Value }).ToList() ?? new()
        };
        if (DateTime.TryParse(row.ReleaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var releaseDate))
            item.ReleaseDate = releaseDate;

        db.CatalogItems.Add(item);
        imported++;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new ImportResponse(imported, rowErrors.Count, rowErrors));
})
.RequireAuthorization()
.DisableAntiforgery()
.WithName("ImportCollection")
.WithOpenApi();

app.Run();

static async Task<List<ImportRowDto>> ParseCsvFile(IFormFile file, List<CustomFieldDefinition> schema)
{
    var rows = new List<ImportRowDto>();
    using var reader = new StreamReader(file.OpenReadStream());
    var headerLine = await reader.ReadLineAsync();
    if (string.IsNullOrWhiteSpace(headerLine)) return rows;

    var headers = ParseCsvLine(headerLine);
    var standardFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        { "Identifier", "Name", "Description", "ReleaseDate", "Manufacturer", "ReferenceCode", "Image", "Rarity" };

    var rowNumber = 1;
    string? line;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        rowNumber++;
        if (string.IsNullOrWhiteSpace(line)) continue;

        var values = ParseCsvLine(line);
        var errors = new List<string>();
        var fieldMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < headers.Count && i < values.Count; i++)
        {
            fieldMap[headers[i]] = values[i];
        }

        // Extract standard fields
        fieldMap.TryGetValue("Identifier", out var identifier);
        fieldMap.TryGetValue("Name", out var name);
        fieldMap.TryGetValue("Description", out var description);
        fieldMap.TryGetValue("ReleaseDate", out var releaseDate);
        fieldMap.TryGetValue("Manufacturer", out var manufacturer);
        fieldMap.TryGetValue("ReferenceCode", out var referenceCode);
        fieldMap.TryGetValue("Image", out var image);
        fieldMap.TryGetValue("Rarity", out var rarity);

        // Validate required fields
        if (string.IsNullOrWhiteSpace(identifier)) errors.Add("Identifier is required");
        if (string.IsNullOrWhiteSpace(name)) errors.Add("Name is required");

        // Validate ReleaseDate format if provided
        if (!string.IsNullOrWhiteSpace(releaseDate) &&
            !DateTime.TryParse(releaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            errors.Add("ReleaseDate is not a valid date");

        // Extract and validate custom fields
        var customFields = new List<CustomFieldValueDto>();
        foreach (var fieldDef in schema)
        {
            fieldMap.TryGetValue(fieldDef.Name, out var fieldValue);

            if (fieldDef.Required && string.IsNullOrWhiteSpace(fieldValue))
            {
                errors.Add($"Custom field '{fieldDef.Name}' is required");
                continue;
            }

            if (!string.IsNullOrWhiteSpace(fieldValue))
            {
                // Validate by type
                switch (fieldDef.Type.ToLowerInvariant())
                {
                    case "number":
                        if (!decimal.TryParse(fieldValue, CultureInfo.InvariantCulture, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be a number");
                        break;
                    case "date":
                        if (!DateTime.TryParse(fieldValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be a valid date");
                        break;
                    case "boolean":
                        if (!bool.TryParse(fieldValue, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be true or false");
                        break;
                    case "enum":
                        if (fieldDef.Options != null && !fieldDef.Options.Contains(fieldValue, StringComparer.OrdinalIgnoreCase))
                            errors.Add($"Custom field '{fieldDef.Name}' must be one of: {string.Join(", ", fieldDef.Options)}");
                        break;
                }

                customFields.Add(new CustomFieldValueDto(fieldDef.Name, fieldValue));
            }
        }

        rows.Add(new ImportRowDto(rowNumber, identifier, name, description, releaseDate, manufacturer, referenceCode, image, rarity, customFields, errors));
    }

    return rows;
}

static List<string> ParseCsvLine(string line)
{
    var fields = new List<string>();
    var current = new StringBuilder();
    var inQuotes = false;
    var i = 0;

    while (i < line.Length)
    {
        if (inQuotes)
        {
            if (line[i] == '"')
            {
                if (i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i += 2;
                }
                else
                {
                    inQuotes = false;
                    i++;
                }
            }
            else
            {
                current.Append(line[i]);
                i++;
            }
        }
        else
        {
            if (line[i] == '"')
            {
                inQuotes = true;
                i++;
            }
            else if (line[i] == ',')
            {
                fields.Add(current.ToString());
                current.Clear();
                i++;
            }
            else
            {
                current.Append(line[i]);
                i++;
            }
        }
    }

    fields.Add(current.ToString());
    return fields;
}

static string CsvEscape(string? value)
{
    if (string.IsNullOrEmpty(value)) return "";
    if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        return $"\"{value.Replace("\"", "\"\"")}\"";
    return value;
}

static string GenerateJwtToken(User user, IConfiguration config)
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
record CreateSetRequest(string Name, int ExpectedItemCount);
record UpdateSetRequest(string? Name, int? ExpectedItemCount);
record SetResponse(int Id, int CollectionId, string Name, int ExpectedItemCount, List<SetItemResponse>? Items, int? CompletedCount, double? CompletionPercentage);
record CreateSetItemRequest(string Name, int? CatalogItemId, int? SortOrder);
record SetItemResponse(int Id, int SetId, int? CatalogItemId, string Name, int SortOrder);
record CreateWishlistItemRequest(string Name, int? CatalogItemId, int Priority, decimal? TargetPrice, string? Notes);
record UpdateWishlistItemRequest(string? Name, int? CatalogItemId, int? Priority, decimal? TargetPrice, string? Notes);
record WishlistItemResponse(int Id, int CollectionId, int? CatalogItemId, string Name, int Priority, decimal? TargetPrice, string? Notes);
record PaginatedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize);
record ConditionCountDto(string Condition, int Count);
record CollectionSummaryDto(int Id, string Name, int ItemCount, int OwnedCount, decimal Value);
record RecentAcquisitionDto(int Id, string ItemName, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource);
record DashboardResponse(int TotalCollections, int TotalItems, int TotalOwnedCopies, decimal TotalEstimatedValue, decimal TotalInvested, List<ConditionCountDto> ItemsByCondition, List<CollectionSummaryDto> CollectionSummaries, List<RecentAcquisitionDto> RecentAcquisitions);
record ImportRowDto(int RowNumber, string? Identifier, string? Name, string? Description, string? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFields, List<string> Errors);
record ImportPreviewResponse(string PreviewId, int TotalRows, int ValidRows, int ErrorRows, bool HasErrors, List<ImportRowDto> Rows);
record ImportConfirmRequest(string PreviewId);
record ImportConfirmResponse(int ImportedCount, int SkippedCount);
record ImportResponse(int ImportedCount, int ErrorCount, List<ImportRowDto> Errors);
