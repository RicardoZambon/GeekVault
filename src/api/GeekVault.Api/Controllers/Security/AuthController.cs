using System.Security.Claims;
using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Repositories.Security;
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

        app.MapGet("/api/auth/me", async (
            ClaimsPrincipal user,
            IUsersRepository usersRepository) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var dbUser = await usersRepository.FindByIdAsync(userId);
            if (dbUser == null) return Results.Unauthorized();

            return Results.Ok(new
            {
                userId,
                email = dbUser.Email,
                displayName = dbUser.DisplayName,
                avatar = dbUser.Avatar
            });
        })
        .RequireAuthorization()
        .WithName("Me")
        .WithOpenApi();

        return app;
    }
}
