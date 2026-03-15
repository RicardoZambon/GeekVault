using System.Security.Claims;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class DashboardController
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard", async (
            ClaimsPrincipal principal,
            IDashboardService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var dashboard = await service.GetDashboardAsync(userId);
            return Results.Ok(dashboard);
        })
        .RequireAuthorization()
        .WithName("GetDashboard")
        .WithOpenApi();

        return app;
    }
}
