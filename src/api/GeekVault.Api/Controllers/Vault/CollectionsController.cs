using System.Security.Claims;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class CollectionsController
{
    public static IEndpointRouteBuilder MapCollectionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/collections", async (
            ClaimsPrincipal principal,
            ICollectionsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var collections = await service.GetAllAsync(userId);
            return Results.Ok(collections);
        })
        .RequireAuthorization()
        .WithName("ListCollections")
        .WithOpenApi();

        app.MapGet("/api/collections/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            ICollectionsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.GetByIdAsync(id, userId);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("GetCollection")
        .WithOpenApi();

        app.MapPost("/api/collections", async (
            CreateCollectionRequest request,
            ClaimsPrincipal principal,
            ICollectionsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.CreateAsync(userId, request);
            return Results.Created($"/api/collections/{response.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateCollection")
        .WithOpenApi();

        app.MapPut("/api/collections/{id:int}", async (
            int id,
            UpdateCollectionRequest request,
            ClaimsPrincipal principal,
            ICollectionsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.UpdateAsync(id, userId, request);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateCollection")
        .WithOpenApi();

        app.MapDelete("/api/collections/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            ICollectionsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var deleted = await service.DeleteAsync(id, userId);
            if (!deleted) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteCollection")
        .WithOpenApi();

        app.MapPost("/api/collections/{id:int}/cover", async (
            int id,
            HttpRequest httpRequest,
            ClaimsPrincipal principal,
            ICollectionsService service,
            IWebHostEnvironment env) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

            if (!httpRequest.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart form data" });

            var form = await httpRequest.ReadFormAsync();
            var file = form.Files.GetFile("cover");
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "No cover file provided" });

            var webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var (coverUrl, notFound, error) = await service.UploadCoverAsync(id, userId, file, webRootPath);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(new { coverUrl });
        })
        .RequireAuthorization()
        .WithName("UploadCollectionCover")
        .WithOpenApi()
        .DisableAntiforgery();

        return app;
    }
}
