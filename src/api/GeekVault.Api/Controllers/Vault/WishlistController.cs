using System.Security.Claims;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Services.Vault;

namespace GeekVault.Api.Controllers.Vault;

public static class WishlistController
{
    public static IEndpointRouteBuilder MapWishlistEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/collections/{collectionId:int}/wishlist", async (
            int collectionId,
            ClaimsPrincipal principal,
            IWishlistService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var items = await service.GetAllAsync(collectionId, userId);
            if (items == null) return Results.NotFound();

            return Results.Ok(items);
        })
        .RequireAuthorization()
        .WithName("ListWishlistItems")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/wishlist", async (
            int collectionId,
            CreateWishlistItemRequest request,
            ClaimsPrincipal principal,
            IWishlistService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.CreateAsync(collectionId, userId, request);
            if (response == null) return Results.NotFound();

            return Results.Created($"/api/collections/{collectionId}/wishlist/{response.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateWishlistItem")
        .WithOpenApi();

        app.MapPut("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
            int collectionId,
            int id,
            UpdateWishlistItemRequest request,
            ClaimsPrincipal principal,
            IWishlistService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, collectionNotFound, itemNotFound) = await service.UpdateAsync(collectionId, id, userId, request);
            if (collectionNotFound || itemNotFound) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateWishlistItem")
        .WithOpenApi();

        app.MapDelete("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
            int collectionId,
            int id,
            ClaimsPrincipal principal,
            IWishlistService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.DeleteAsync(collectionId, id, userId);
            if (result == null) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteWishlistItem")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/wishlist/reorder", async (
            int collectionId,
            ReorderWishlistItemsRequest request,
            ClaimsPrincipal principal,
            IWishlistService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (success, notFound, error) = await service.ReorderAsync(collectionId, userId, request.ItemIds);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("ReorderWishlistItems")
        .WithOpenApi();

        return app;
    }
}
