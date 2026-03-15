using System.Security.Claims;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class CollectionTypesController
{
    public static IEndpointRouteBuilder MapCollectionTypeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/collection-types", async (
            ClaimsPrincipal principal,
            ICollectionTypesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var types = await service.GetAllAsync(userId);
            return Results.Ok(types);
        })
        .RequireAuthorization()
        .WithName("ListCollectionTypes")
        .WithOpenApi();

        app.MapGet("/api/collection-types/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            ICollectionTypesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.GetByIdAsync(id, userId);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("GetCollectionType")
        .WithOpenApi();

        app.MapPost("/api/collection-types", async (
            CreateCollectionTypeRequest request,
            ClaimsPrincipal principal,
            ICollectionTypesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, error) = await service.CreateAsync(userId, request);
            if (error != null) return Results.BadRequest(new { error });

            return Results.Created($"/api/collection-types/{response!.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateCollectionType")
        .WithOpenApi();

        app.MapPut("/api/collection-types/{id:int}", async (
            int id,
            UpdateCollectionTypeRequest request,
            ClaimsPrincipal principal,
            ICollectionTypesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, error) = await service.UpdateAsync(id, userId, request);
            if (response == null && error == null) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateCollectionType")
        .WithOpenApi();

        app.MapDelete("/api/collection-types/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            ICollectionTypesService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var deleted = await service.DeleteAsync(id, userId);
            if (!deleted) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteCollectionType")
        .WithOpenApi();

        return app;
    }
}
