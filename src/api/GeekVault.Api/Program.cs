using System.Security.Claims;
using System.Text;
using GeekVault.Api.Data;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Entities.Vault;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using GeekVault.Api.Controllers.Security;
using GeekVault.Api.Controllers.Vault;
using GeekVault.Api.Repositories.Security;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Security;
using GeekVault.Api.Services.Vault;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsHistoryTable("MigrationsHistory", "EF")));

builder.Services.AddIdentityCore<User>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddScoped<IUsersRepository, UsersRepository>();
builder.Services.AddScoped<ICollectionTypesRepository, CollectionTypesRepository>();
builder.Services.AddScoped<ICollectionsRepository, CollectionsRepository>();
builder.Services.AddScoped<ICatalogItemsRepository, CatalogItemsRepository>();
builder.Services.AddScoped<IOwnedCopiesRepository, OwnedCopiesRepository>();
builder.Services.AddScoped<ISetsRepository, SetsRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();

builder.Services.AddScoped<ICollectionTypesService, CollectionTypesService>();
builder.Services.AddScoped<ICollectionsService, CollectionsService>();
builder.Services.AddScoped<ICatalogItemsService, CatalogItemsService>();
builder.Services.AddScoped<IOwnedCopiesService, OwnedCopiesService>();
builder.Services.AddScoped<ISetsService, SetsService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
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

// Set endpoints
app.MapGet("/api/collections/{collectionId:int}/sets", async (
    int collectionId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var sets = await db.Sets
        .Where(s => s.CollectionId == collectionId)
        .Select(s => new SetResponse(s.Id, s.CollectionId, s.Name, s.ExpectedItemCount, null, null, null))
        .ToListAsync();
    return Results.Ok(sets);
})
.RequireAuthorization()
.WithName("ListSets")
.WithOpenApi();

app.MapGet("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    var items = await db.SetItems
        .Where(si => si.SetId == id)
        .OrderBy(si => si.SortOrder)
        .Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder))
        .ToListAsync();

    // Calculate completion: a set item is complete if its linked CatalogItem has at least one OwnedCopy
    var completedCount = 0;
    foreach (var item in items)
    {
        if (item.CatalogItemId != null)
        {
            var hasOwnedCopy = await db.OwnedCopies.AnyAsync(oc => oc.CatalogItemId == item.CatalogItemId);
            if (hasOwnedCopy) completedCount++;
        }
    }
    var completionPercentage = set.ExpectedItemCount > 0
        ? (double)completedCount / set.ExpectedItemCount * 100
        : 0;

    return Results.Ok(new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount,
        items, completedCount, Math.Round(completionPercentage, 2)));
})
.RequireAuthorization()
.WithName("GetSet")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/sets", async (
    int collectionId,
    CreateSetRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = new Set
    {
        CollectionId = collectionId,
        Name = request.Name,
        ExpectedItemCount = request.ExpectedItemCount
    };

    db.Sets.Add(set);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collectionId}/sets/{set.Id}",
        new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null));
})
.RequireAuthorization()
.WithName("CreateSet")
.WithOpenApi();

app.MapPut("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    UpdateSetRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    set.Name = request.Name ?? set.Name;
    if (request.ExpectedItemCount.HasValue)
        set.ExpectedItemCount = request.ExpectedItemCount.Value;

    await db.SaveChangesAsync();

    return Results.Ok(new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null));
})
.RequireAuthorization()
.WithName("UpdateSet")
.WithOpenApi();

app.MapDelete("/api/collections/{collectionId:int}/sets/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    db.Sets.Remove(set);
    await db.SaveChangesAsync();

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
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var set = await db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    if (set == null) return Results.NotFound();

    var maxSortOrder = await db.SetItems
        .Where(si => si.SetId == id)
        .Select(si => (int?)si.SortOrder)
        .MaxAsync() ?? 0;

    var items = new List<SetItem>();
    foreach (var itemReq in request)
    {
        maxSortOrder++;
        var setItem = new SetItem
        {
            SetId = id,
            CatalogItemId = itemReq.CatalogItemId,
            Name = itemReq.Name,
            SortOrder = itemReq.SortOrder ?? maxSortOrder
        };
        items.Add(setItem);
        db.SetItems.Add(setItem);
    }

    await db.SaveChangesAsync();

    var response = items.Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder)).ToList();
    return Results.Created($"/api/collections/{collectionId}/sets/{id}/items", response);
})
.RequireAuthorization()
.WithName("AddSetItems")
.WithOpenApi();

// Wishlist endpoints
app.MapGet("/api/collections/{collectionId:int}/wishlist", async (
    int collectionId,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var items = await db.WishlistItems
        .Where(w => w.CollectionId == collectionId)
        .OrderBy(w => w.Priority)
        .Select(w => new WishlistItemResponse(w.Id, w.CollectionId, w.CatalogItemId, w.Name, w.Priority, w.TargetPrice, w.Notes))
        .ToListAsync();
    return Results.Ok(items);
})
.RequireAuthorization()
.WithName("ListWishlistItems")
.WithOpenApi();

app.MapPost("/api/collections/{collectionId:int}/wishlist", async (
    int collectionId,
    CreateWishlistItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = new WishlistItem
    {
        CollectionId = collectionId,
        CatalogItemId = request.CatalogItemId,
        Name = request.Name,
        Priority = request.Priority,
        TargetPrice = request.TargetPrice,
        Notes = request.Notes
    };

    db.WishlistItems.Add(item);
    await db.SaveChangesAsync();

    return Results.Created($"/api/collections/{collectionId}/wishlist/{item.Id}",
        new WishlistItemResponse(item.Id, item.CollectionId, item.CatalogItemId, item.Name, item.Priority, item.TargetPrice, item.Notes));
})
.RequireAuthorization()
.WithName("CreateWishlistItem")
.WithOpenApi();

app.MapPut("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
    int collectionId,
    int id,
    UpdateWishlistItemRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    item.Name = request.Name ?? item.Name;
    item.CatalogItemId = request.CatalogItemId;
    if (request.Priority.HasValue)
        item.Priority = request.Priority.Value;
    item.TargetPrice = request.TargetPrice;
    item.Notes = request.Notes;

    await db.SaveChangesAsync();

    return Results.Ok(new WishlistItemResponse(item.Id, item.CollectionId, item.CatalogItemId, item.Name, item.Priority, item.TargetPrice, item.Notes));
})
.RequireAuthorization()
.WithName("UpdateWishlistItem")
.WithOpenApi();

app.MapDelete("/api/collections/{collectionId:int}/wishlist/{id:int}", async (
    int collectionId,
    int id,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var item = await db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.CollectionId == collectionId);
    if (item == null) return Results.NotFound();

    db.WishlistItems.Remove(item);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization()
.WithName("DeleteWishlistItem")
.WithOpenApi();

// Dashboard analytics
app.MapGet("/api/dashboard", async (ClaimsPrincipal principal, ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;

    var userCollections = await db.Collections
        .Where(c => c.UserId == userId)
        .Select(c => new
        {
            c.Id,
            c.Name,
            ItemCount = db.CatalogItems.Count(ci => ci.CollectionId == c.Id),
            OwnedCount = db.OwnedCopies.Count(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id)),
            Value = db.OwnedCopies
                .Where(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                .Sum(oc => (decimal?)oc.EstimatedValue ?? 0m),
            Invested = db.OwnedCopies
                .Where(oc => db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                .Sum(oc => (decimal?)oc.PurchasePrice ?? 0m)
        })
        .ToListAsync();

    var totalCollections = userCollections.Count;
    var totalItems = userCollections.Sum(c => c.ItemCount);
    var totalOwnedCopies = userCollections.Sum(c => c.OwnedCount);
    var totalEstimatedValue = userCollections.Sum(c => c.Value);
    var totalInvested = userCollections.Sum(c => c.Invested);

    var collectionSummaries = userCollections.Select(c =>
        new CollectionSummaryDto(c.Id, c.Name, c.ItemCount, c.OwnedCount, c.Value)).ToList();

    // Items by condition
    var userCatalogItemIds = db.CatalogItems
        .Where(ci => db.Collections.Any(c => c.Id == ci.CollectionId && c.UserId == userId))
        .Select(ci => ci.Id);

    var itemsByCondition = await db.OwnedCopies
        .Where(oc => userCatalogItemIds.Contains(oc.CatalogItemId))
        .GroupBy(oc => oc.Condition)
        .Select(g => new ConditionCountDto(g.Key.ToString(), g.Count()))
        .ToListAsync();

    // Recent acquisitions (last 10)
    var recentAcquisitions = await db.OwnedCopies
        .Where(oc => userCatalogItemIds.Contains(oc.CatalogItemId))
        .OrderByDescending(oc => oc.AcquisitionDate)
        .ThenByDescending(oc => oc.Id)
        .Take(10)
        .Join(db.CatalogItems, oc => oc.CatalogItemId, ci => ci.Id, (oc, ci) => new RecentAcquisitionDto(
            oc.Id, ci.Name, oc.Condition.ToString(), oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource))
        .ToListAsync();

    return Results.Ok(new DashboardResponse(
        totalCollections, totalItems, totalOwnedCopies, totalEstimatedValue, totalInvested,
        itemsByCondition, collectionSummaries, recentAcquisitions));
})
.RequireAuthorization()
.WithName("GetDashboard")
.WithOpenApi();

app.Run();

