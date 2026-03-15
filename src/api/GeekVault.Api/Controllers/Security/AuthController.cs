using System.Security.Claims;
using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Services.Security;

namespace GeekVault.Api.Controllers.Security;

public static class AuthController
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", async (
            RegisterRequest request,
            IAuthService authService) =>
        {
            var (response, errors) = await authService.RegisterAsync(request);
            if (errors != null)
            {
                return Results.BadRequest(new { errors });
            }

            return Results.Ok(response);
        })
        .WithName("Register")
        .WithOpenApi();

        app.MapPost("/api/auth/login", async (
            LoginRequest request,
            IAuthService authService) =>
        {
            var response = await authService.LoginAsync(request);
            if (response == null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(response);
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

        app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = user.FindFirstValue(ClaimTypes.Email);
            return Results.Ok(new { userId, email });
        })
        .RequireAuthorization()
        .WithName("Me")
        .WithOpenApi();

        return app;
    }
}
