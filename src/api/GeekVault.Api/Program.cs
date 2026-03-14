using GeekVault.Api.Controllers.Security;
using GeekVault.Api.Controllers.Vault;
using GeekVault.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSecurityServices(builder.Configuration);
builder.Services.AddVaultServices();

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
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
app.MapSetEndpoints();
app.MapWishlistEndpoints();
app.MapDashboardEndpoints();

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

// Export endpoints
app.MapGet("/api/collections/{id:int}/export", async (
    int id,
    string? format,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var items = await db.CatalogItems
        .Where(ci => ci.CollectionId == id)
        .Include(ci => ci.CustomFieldValues)
        .ToListAsync();

    var ownedCopies = await db.OwnedCopies
        .Where(oc => items.Select(i => i.Id).Contains(oc.CatalogItemId))
        .Include(oc => oc.Images)
        .ToListAsync();

    var exportFormat = (format ?? "json").ToLowerInvariant();

    if (exportFormat == "csv")
    {
        var sb = new StringBuilder();
        // Header
        sb.AppendLine("Id,Identifier,Name,Description,ReleaseDate,Manufacturer,ReferenceCode,Image,Rarity,CustomFields,CopyId,Condition,PurchasePrice,EstimatedValue,AcquisitionDate,AcquisitionSource,Notes");

        foreach (var item in items)
        {
            var copies = ownedCopies.Where(oc => oc.CatalogItemId == item.Id).ToList();
            var customFields = item.CustomFieldValues?.Any() == true
                ? string.Join("; ", item.CustomFieldValues.Select(cf => $"{cf.Name}={cf.Value}"))
                : "";

            if (copies.Count == 0)
            {
                sb.AppendLine($"{item.Id},{CsvEscape(item.Identifier)},{CsvEscape(item.Name)},{CsvEscape(item.Description)},{item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(item.Manufacturer)},{CsvEscape(item.ReferenceCode)},{CsvEscape(item.Image)},{CsvEscape(item.Rarity)},{CsvEscape(customFields)},,,,,,");
            }
            else
            {
                foreach (var copy in copies)
                {
                    sb.AppendLine($"{item.Id},{CsvEscape(item.Identifier)},{CsvEscape(item.Name)},{CsvEscape(item.Description)},{item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(item.Manufacturer)},{CsvEscape(item.ReferenceCode)},{CsvEscape(item.Image)},{CsvEscape(item.Rarity)},{CsvEscape(customFields)},{copy.Id},{copy.Condition},{copy.PurchasePrice?.ToString(CultureInfo.InvariantCulture)},{copy.EstimatedValue?.ToString(CultureInfo.InvariantCulture)},{copy.AcquisitionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)},{CsvEscape(copy.AcquisitionSource)},{CsvEscape(copy.Notes)}");
                }
            }
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", $"{collection.Name}_export.csv");
    }
    else if (exportFormat == "json")
    {
        var exportData = items.Select(item => new
        {
            item.Id,
            item.Identifier,
            item.Name,
            item.Description,
            ReleaseDate = item.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            item.Manufacturer,
            item.ReferenceCode,
            item.Image,
            item.Rarity,
            CustomFields = item.CustomFieldValues?.Select(cf => new { cf.Name, cf.Value }).ToList(),
            OwnedCopies = ownedCopies.Where(oc => oc.CatalogItemId == item.Id).Select(oc => new
            {
                oc.Id,
                Condition = oc.Condition.ToString(),
                oc.PurchasePrice,
                oc.EstimatedValue,
                AcquisitionDate = oc.AcquisitionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                oc.AcquisitionSource,
                oc.Notes,
                Images = oc.Images?.Select(img => img.Url).ToList()
            }).ToList()
        }).ToList();

        var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(exportData, new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return Results.File(jsonBytes, "application/json", $"{collection.Name}_export.json");
    }
    else
    {
        return Results.BadRequest(new { error = "Unsupported format. Use 'csv' or 'json'." });
    }
})
.RequireAuthorization()
.WithName("ExportCollection")
.WithOpenApi();

// Import endpoints
var importPreviews = new Dictionary<string, List<ImportRowDto>>();

app.MapPost("/api/collections/{id:int}/import/preview", async (
    int id,
    HttpRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
            .ThenInclude(ct => ct.CustomFieldSchema)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    var form = await request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No CSV file provided." });

    var schema = collection.CollectionType.CustomFieldSchema;
    var rows = await ParseCsvFile(file, schema);

    var previewId = Guid.NewGuid().ToString();
    importPreviews[previewId] = rows;

    var hasErrors = rows.Any(r => r.Errors.Count > 0);
    return Results.Ok(new ImportPreviewResponse(previewId, rows.Count, rows.Count(r => r.Errors.Count == 0), rows.Count(r => r.Errors.Count > 0), hasErrors, rows));
})
.RequireAuthorization()
.DisableAntiforgery()
.WithName("ImportPreview")
.WithOpenApi();

app.MapPost("/api/collections/{id:int}/import/confirm", async (
    int id,
    ImportConfirmRequest confirmRequest,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    if (!importPreviews.TryGetValue(confirmRequest.PreviewId, out var rows))
        return Results.BadRequest(new { error = "Preview not found or expired." });

    importPreviews.Remove(confirmRequest.PreviewId);

    var validRows = rows.Where(r => r.Errors.Count == 0).ToList();
    var imported = 0;

    foreach (var row in validRows)
    {
        var item = new CatalogItem
        {
            CollectionId = id,
            Identifier = row.Identifier ?? "",
            Name = row.Name ?? "",
            Description = row.Description,
            Manufacturer = row.Manufacturer,
            ReferenceCode = row.ReferenceCode,
            Image = row.Image,
            Rarity = row.Rarity,
            CustomFieldValues = row.CustomFields?.Select(cf => new CustomFieldValue { Name = cf.Name, Value = cf.Value }).ToList() ?? new()
        };
        if (DateTime.TryParse(row.ReleaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var releaseDate))
            item.ReleaseDate = releaseDate;

        db.CatalogItems.Add(item);
        imported++;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new ImportConfirmResponse(imported, rows.Count - imported));
})
.RequireAuthorization()
.WithName("ImportConfirm")
.WithOpenApi();

app.MapPost("/api/collections/{id:int}/import", async (
    int id,
    HttpRequest request,
    ClaimsPrincipal principal,
    ApplicationDbContext db) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var collection = await db.Collections
        .Include(c => c.CollectionType)
            .ThenInclude(ct => ct.CustomFieldSchema)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    if (collection == null) return Results.NotFound();

    IFormFile? file = null;
    try
    {
        var form = await request.ReadFormAsync();
        file = form.Files.FirstOrDefault();
    }
    catch { }
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No CSV file provided." });

    var schema = collection.CollectionType.CustomFieldSchema;
    var rows = await ParseCsvFile(file, schema);

    var validRows = rows.Where(r => r.Errors.Count == 0).ToList();
    var imported = 0;
    var rowErrors = rows.Where(r => r.Errors.Count > 0).ToList();

    foreach (var row in validRows)
    {
        var item = new CatalogItem
        {
            CollectionId = id,
            Identifier = row.Identifier ?? "",
            Name = row.Name ?? "",
            Description = row.Description,
            Manufacturer = row.Manufacturer,
            ReferenceCode = row.ReferenceCode,
            Image = row.Image,
            Rarity = row.Rarity,
            CustomFieldValues = row.CustomFields?.Select(cf => new CustomFieldValue { Name = cf.Name, Value = cf.Value }).ToList() ?? new()
        };
        if (DateTime.TryParse(row.ReleaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var releaseDate))
            item.ReleaseDate = releaseDate;

        db.CatalogItems.Add(item);
        imported++;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new ImportResponse(imported, rowErrors.Count, rowErrors));
})
.RequireAuthorization()
.DisableAntiforgery()
.WithName("ImportCollection")
.WithOpenApi();

app.Run();

static async Task<List<ImportRowDto>> ParseCsvFile(IFormFile file, List<CustomFieldDefinition> schema)
{
    var rows = new List<ImportRowDto>();
    using var reader = new StreamReader(file.OpenReadStream());
    var headerLine = await reader.ReadLineAsync();
    if (string.IsNullOrWhiteSpace(headerLine)) return rows;

    var headers = ParseCsvLine(headerLine);
    var standardFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        { "Identifier", "Name", "Description", "ReleaseDate", "Manufacturer", "ReferenceCode", "Image", "Rarity" };

    var rowNumber = 1;
    string? line;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        rowNumber++;
        if (string.IsNullOrWhiteSpace(line)) continue;

        var values = ParseCsvLine(line);
        var errors = new List<string>();
        var fieldMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < headers.Count && i < values.Count; i++)
        {
            fieldMap[headers[i]] = values[i];
        }

        // Extract standard fields
        fieldMap.TryGetValue("Identifier", out var identifier);
        fieldMap.TryGetValue("Name", out var name);
        fieldMap.TryGetValue("Description", out var description);
        fieldMap.TryGetValue("ReleaseDate", out var releaseDate);
        fieldMap.TryGetValue("Manufacturer", out var manufacturer);
        fieldMap.TryGetValue("ReferenceCode", out var referenceCode);
        fieldMap.TryGetValue("Image", out var image);
        fieldMap.TryGetValue("Rarity", out var rarity);

        // Validate required fields
        if (string.IsNullOrWhiteSpace(identifier)) errors.Add("Identifier is required");
        if (string.IsNullOrWhiteSpace(name)) errors.Add("Name is required");

        // Validate ReleaseDate format if provided
        if (!string.IsNullOrWhiteSpace(releaseDate) &&
            !DateTime.TryParse(releaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            errors.Add("ReleaseDate is not a valid date");

        // Extract and validate custom fields
        var customFields = new List<CustomFieldValueDto>();
        foreach (var fieldDef in schema)
        {
            fieldMap.TryGetValue(fieldDef.Name, out var fieldValue);

            if (fieldDef.Required && string.IsNullOrWhiteSpace(fieldValue))
            {
                errors.Add($"Custom field '{fieldDef.Name}' is required");
                continue;
            }

            if (!string.IsNullOrWhiteSpace(fieldValue))
            {
                // Validate by type
                switch (fieldDef.Type.ToLowerInvariant())
                {
                    case "number":
                        if (!decimal.TryParse(fieldValue, CultureInfo.InvariantCulture, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be a number");
                        break;
                    case "date":
                        if (!DateTime.TryParse(fieldValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be a valid date");
                        break;
                    case "boolean":
                        if (!bool.TryParse(fieldValue, out _))
                            errors.Add($"Custom field '{fieldDef.Name}' must be true or false");
                        break;
                    case "enum":
                        if (fieldDef.Options != null && !fieldDef.Options.Contains(fieldValue, StringComparer.OrdinalIgnoreCase))
                            errors.Add($"Custom field '{fieldDef.Name}' must be one of: {string.Join(", ", fieldDef.Options)}");
                        break;
                }

                customFields.Add(new CustomFieldValueDto(fieldDef.Name, fieldValue));
            }
        }

        rows.Add(new ImportRowDto(rowNumber, identifier, name, description, releaseDate, manufacturer, referenceCode, image, rarity, customFields, errors));
    }

    return rows;
}

static List<string> ParseCsvLine(string line)
{
    var fields = new List<string>();
    var current = new StringBuilder();
    var inQuotes = false;
    var i = 0;

    while (i < line.Length)
    {
        if (inQuotes)
        {
            if (line[i] == '"')
            {
                if (i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i += 2;
                }
                else
                {
                    inQuotes = false;
                    i++;
                }
            }
            else
            {
                current.Append(line[i]);
                i++;
            }
        }
        else
        {
            if (line[i] == '"')
            {
                inQuotes = true;
                i++;
            }
            else if (line[i] == ',')
            {
                fields.Add(current.ToString());
                current.Clear();
                i++;
            }
            else
            {
                current.Append(line[i]);
                i++;
            }
        }
    }

    fields.Add(current.ToString());
    return fields;
}

static string CsvEscape(string? value)
{
    if (string.IsNullOrEmpty(value)) return "";
    if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        return $"\"{value.Replace("\"", "\"\"")}\"";
    return value;
}

static string GenerateJwtToken(ApplicationUser user, IConfiguration config)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expires = DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:ExpiresInMinutes"]!));

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email!),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var token = new JwtSecurityToken(
        issuer: config["Jwt:Issuer"],
        audience: config["Jwt:Audience"],
        claims: claims,
        expires: expires,
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}

// Request/Response records
record RegisterRequest(string Email, string Password, string? DisplayName);
record LoginRequest(string Email, string Password);
record AuthResponse(string Token, string UserId, string Email, string? DisplayName);
record UpdateProfileRequest(string? DisplayName, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
record ProfileResponse(string Id, string Email, string? DisplayName, string? Avatar, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
record CustomFieldDto(string Name, string Type, bool Required, List<string>? Options);
record CreateCollectionTypeRequest(string Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
record UpdateCollectionTypeRequest(string? Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
record CollectionTypeResponse(int Id, string Name, string? Description, string? Icon, List<CustomFieldDto> CustomFields);
record CreateCollectionRequest(string Name, string? Description, int CollectionTypeId, string? Visibility);
record UpdateCollectionRequest(string? Name, string? Description, string? Visibility);
record CollectionResponse(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, int ItemCount);
record CustomFieldValueDto(string Name, string Value);
record CreateCatalogItemRequest(string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
record UpdateCatalogItemRequest(string? Identifier, string? Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
record OwnedCopyDto(int Id, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes);
record CatalogItemResponse(int Id, int CollectionId, string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFieldValues, List<OwnedCopyDto>? OwnedCopies);
record CreateOwnedCopyRequest(string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string>? Images);
record UpdateOwnedCopyRequest(string? Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string>? Images);
record OwnedCopyResponse(int Id, int CatalogItemId, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string> Images);
record CreateSetRequest(string Name, int ExpectedItemCount);
record UpdateSetRequest(string? Name, int? ExpectedItemCount);
record SetResponse(int Id, int CollectionId, string Name, int ExpectedItemCount, List<SetItemResponse>? Items, int? CompletedCount, double? CompletionPercentage);
record CreateSetItemRequest(string Name, int? CatalogItemId, int? SortOrder);
record SetItemResponse(int Id, int SetId, int? CatalogItemId, string Name, int SortOrder);
record CreateWishlistItemRequest(string Name, int? CatalogItemId, int Priority, decimal? TargetPrice, string? Notes);
record UpdateWishlistItemRequest(string? Name, int? CatalogItemId, int? Priority, decimal? TargetPrice, string? Notes);
record WishlistItemResponse(int Id, int CollectionId, int? CatalogItemId, string Name, int Priority, decimal? TargetPrice, string? Notes);
record PaginatedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize);
record ConditionCountDto(string Condition, int Count);
record CollectionSummaryDto(int Id, string Name, int ItemCount, int OwnedCount, decimal Value);
record RecentAcquisitionDto(int Id, string ItemName, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource);
record DashboardResponse(int TotalCollections, int TotalItems, int TotalOwnedCopies, decimal TotalEstimatedValue, decimal TotalInvested, List<ConditionCountDto> ItemsByCondition, List<CollectionSummaryDto> CollectionSummaries, List<RecentAcquisitionDto> RecentAcquisitions);
record ImportRowDto(int RowNumber, string? Identifier, string? Name, string? Description, string? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFields, List<string> Errors);
record ImportPreviewResponse(string PreviewId, int TotalRows, int ValidRows, int ErrorRows, bool HasErrors, List<ImportRowDto> Rows);
record ImportConfirmRequest(string PreviewId);
record ImportConfirmResponse(int ImportedCount, int SkippedCount);
record ImportResponse(int ImportedCount, int ErrorCount, List<ImportRowDto> Errors);
