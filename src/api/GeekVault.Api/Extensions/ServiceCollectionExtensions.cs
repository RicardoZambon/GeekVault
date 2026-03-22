using System.Text;
using GeekVault.Api.Data;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Repositories.Admin;
using GeekVault.Api.Repositories.Security;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Admin;
using GeekVault.Api.Services.Security;
using GeekVault.Api.Services.Vault;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GeekVault.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSecurityServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                x => x.MigrationsHistoryTable("MigrationsHistory", "EF")));

        services.AddIdentityCore<User>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        var jwtKey = configuration["Jwt:Key"]!;
        var jwtIssuer = configuration["Jwt:Issuer"]!;
        var jwtAudience = configuration["Jwt:Audience"]!;

        services.AddAuthentication(options =>
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

        services.AddAuthorizationBuilder()
            .AddPolicy("AdminOnly", p => p.RequireRole("Admin"));

        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();

        return services;
    }

    public static IServiceCollection AddVaultServices(this IServiceCollection services)
    {
        services.AddScoped<ICollectionTypesRepository, CollectionTypesRepository>();
        services.AddScoped<ICollectionsRepository, CollectionsRepository>();
        services.AddScoped<ICatalogItemsRepository, CatalogItemsRepository>();
        services.AddScoped<IOwnedCopiesRepository, OwnedCopiesRepository>();
        services.AddScoped<ISetsRepository, SetsRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();

        services.AddScoped<ICollectionTypesService, CollectionTypesService>();
        services.AddScoped<ICollectionsService, CollectionsService>();
        services.AddScoped<ICatalogItemsService, CatalogItemsService>();
        services.AddScoped<IOwnedCopiesService, OwnedCopiesService>();
        services.AddScoped<ISetsService, SetsService>();
        services.AddScoped<IWishlistService, WishlistService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }

    public static IServiceCollection AddAdminServices(this IServiceCollection services)
    {
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        return services;
    }
}
