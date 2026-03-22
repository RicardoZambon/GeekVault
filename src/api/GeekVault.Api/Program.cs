using GeekVault.Api.Controllers.Security;
using GeekVault.Api.Controllers.Vault;
using GeekVault.Api.Extensions;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSecurityServices(builder.Configuration);
builder.Services.AddVaultServices();
builder.Services.AddAdminServices();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seed roles
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    string[] roles = ["Admin", "User"];
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
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
