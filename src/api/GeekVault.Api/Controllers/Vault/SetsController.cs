using System.Security.Claims;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class SetsController
{
    public static IEndpointRouteBuilder MapSetEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/collections/{collectionId:int}/sets", async (
            int collectionId,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var sets = await service.GetAllAsync(collectionId, userId);
            if (sets == null) return Results.NotFound();

            return Results.Ok(sets);
        })
        .RequireAuthorization()
        .WithName("ListSets")
        .WithOpenApi();

        app.MapGet("/api/collections/{collectionId:int}/sets/{id:int}", async (
            int collectionId,
            int id,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.GetByIdAsync(collectionId, id, userId);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("GetSet")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/sets", async (
            int collectionId,
            CreateSetRequest request,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.CreateAsync(collectionId, userId, request);
            if (response == null) return Results.NotFound();

            return Results.Created($"/api/collections/{collectionId}/sets/{response.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateSet")
        .WithOpenApi();

        app.MapPut("/api/collections/{collectionId:int}/sets/{id:int}", async (
            int collectionId,
            int id,
            UpdateSetRequest request,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.UpdateAsync(collectionId, id, userId, request);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateSet")
        .WithOpenApi();

        app.MapDelete("/api/collections/{collectionId:int}/sets/{id:int}", async (
            int collectionId,
            int id,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.DeleteAsync(collectionId, id, userId);
            if (result == null) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteSet")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/sets/{id:int}/items", async (
            int collectionId,
            int id,
            List<CreateSetItemRequest> request,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var items = await service.AddItemsAsync(collectionId, id, userId, request);
            if (items == null) return Results.NotFound();

            return Results.Created($"/api/collections/{collectionId}/sets/{id}/items", items);
        })
        .RequireAuthorization()
        .WithName("AddSetItems")
        .WithOpenApi();

        app.MapDelete("/api/collections/{collectionId:int}/sets/{id:int}/items/{itemId:int}", async (
            int collectionId,
            int id,
            int itemId,
            ClaimsPrincipal principal,
            ISetsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.DeleteSetItemAsync(collectionId, id, itemId, userId);
            if (result == null || result == false) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteSetItem")
        .WithOpenApi();

        return app;
    }
}
