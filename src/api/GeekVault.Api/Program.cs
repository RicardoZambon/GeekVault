using System.Text;
using GeekVault.Api.Data;
using GeekVault.Api.Entities.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using GeekVault.Api.Controllers.Security;
using GeekVault.Api.Controllers.Vault;
using GeekVault.Api.Repositories.Security;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Security;
using GeekVault.Api.Services.Vault;

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

builder.Services.AddScoped<IUsersRepository, UsersRepository>();
builder.Services.AddScoped<ICollectionTypesRepository, CollectionTypesRepository>();
builder.Services.AddScoped<ICollectionsRepository, CollectionsRepository>();
builder.Services.AddScoped<ICatalogItemsRepository, CatalogItemsRepository>();
builder.Services.AddScoped<IOwnedCopiesRepository, OwnedCopiesRepository>();
builder.Services.AddScoped<ISetsRepository, SetsRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();

builder.Services.AddScoped<ICollectionTypesService, CollectionTypesService>();
builder.Services.AddScoped<ICollectionsService, CollectionsService>();
builder.Services.AddScoped<ICatalogItemsService, CatalogItemsService>();
builder.Services.AddScoped<IOwnedCopiesService, OwnedCopiesService>();
builder.Services.AddScoped<ISetsService, SetsService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

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

app.MapAuthEndpoints();
app.MapProfileEndpoints();
app.MapCollectionTypeEndpoints();
app.MapCollectionEndpoints();
app.MapCatalogItemEndpoints();
app.MapOwnedCopyEndpoints();
app.MapSetEndpoints();
app.MapWishlistEndpoints();
app.MapDashboardEndpoints();

app.Run();

