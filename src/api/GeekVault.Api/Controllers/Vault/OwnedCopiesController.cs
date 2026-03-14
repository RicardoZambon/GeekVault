using System.Security.Claims;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class OwnedCopiesController
{
    public static IEndpointRouteBuilder MapOwnedCopyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/items/{catalogItemId:int}/copies", async (
            int catalogItemId,
            ClaimsPrincipal principal,
            IOwnedCopiesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var copies = await service.GetAllAsync(catalogItemId, userId);
            if (copies == null) return Results.NotFound();

            return Results.Ok(copies);
        })
        .RequireAuthorization()
        .WithName("ListOwnedCopies")
        .WithOpenApi();

        app.MapPost("/api/items/{catalogItemId:int}/copies", async (
            int catalogItemId,
            CreateOwnedCopyRequest request,
            ClaimsPrincipal principal,
            IOwnedCopiesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, notFound, error) = await service.CreateAsync(catalogItemId, userId, request);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Created($"/api/items/{catalogItemId}/copies/{response!.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateOwnedCopy")
        .WithOpenApi();

        app.MapPut("/api/items/{catalogItemId:int}/copies/{id:int}", async (
            int catalogItemId,
            int id,
            UpdateOwnedCopyRequest request,
            ClaimsPrincipal principal,
            IOwnedCopiesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, notFound, error) = await service.UpdateAsync(catalogItemId, id, userId, request);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateOwnedCopy")
        .WithOpenApi();

        app.MapDelete("/api/items/{catalogItemId:int}/copies/{id:int}", async (
            int catalogItemId,
            int id,
            ClaimsPrincipal principal,
            IOwnedCopiesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.DeleteAsync(catalogItemId, id, userId);
            if (result == null) return Results.NotFound();
            if (result == false) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteOwnedCopy")
        .WithOpenApi();

        app.MapPost("/api/items/{catalogItemId:int}/copies/{id:int}/images", async (
            int catalogItemId,
            int id,
            HttpRequest httpRequest,
            ClaimsPrincipal principal,
            IOwnedCopiesService service,
            IWebHostEnvironment env) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

            if (!httpRequest.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart form data" });

            var form = await httpRequest.ReadFormAsync();
            var file = form.Files.GetFile("image");
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "No image file provided" });

            var webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var (response, notFound, error) = await service.UploadImageAsync(catalogItemId, id, userId, file, webRootPath);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UploadOwnedCopyImage")
        .WithOpenApi()
        .DisableAntiforgery();

        return app;
    }
}
