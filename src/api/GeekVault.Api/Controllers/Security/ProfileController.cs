using System.Security.Claims;
using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Services.Security;

namespace GeekVault.Api.Controllers.Security;

public static class ProfileController
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/profile", async (
            ClaimsPrincipal principal,
            IProfileService profileService) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var response = await profileService.GetProfileAsync(userId!);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("GetProfile")
        .WithOpenApi();

        app.MapPut("/api/profile", async (
            UpdateProfileRequest request,
            ClaimsPrincipal principal,
            IProfileService profileService) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var (response, errors) = await profileService.UpdateProfileAsync(userId!, request);
            if (response == null && errors == null) return Results.NotFound();
            if (errors != null) return Results.BadRequest(new { errors });

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateProfile")
        .WithOpenApi();

        app.MapPost("/api/profile/avatar", async (
            HttpRequest httpRequest,
            ClaimsPrincipal principal,
            IProfileService profileService,
            IWebHostEnvironment env) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!httpRequest.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart form data" });

            var form = await httpRequest.ReadFormAsync();
            var file = form.Files.GetFile("avatar");
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "No avatar file provided" });

            var webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var (avatarUrl, error) = await profileService.UploadAvatarAsync(userId!, file, webRootPath);
            if (error != null) return Results.NotFound();

            return Results.Ok(new { avatarUrl });
        })
        .RequireAuthorization()
        .WithName("UploadAvatar")
        .WithOpenApi()
        .DisableAntiforgery();

        return app;
    }
}
