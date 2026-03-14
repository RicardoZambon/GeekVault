using GeekVault.Api.Controllers.Security;
using GeekVault.Api.Controllers.Vault;
using GeekVault.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSecurityServices(builder.Configuration);
builder.Services.AddVaultServices();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

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
