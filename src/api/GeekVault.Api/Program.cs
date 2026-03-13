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
