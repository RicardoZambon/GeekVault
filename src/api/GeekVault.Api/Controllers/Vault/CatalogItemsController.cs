using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GeekVault.Api.Data;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Services.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Controllers.Vault;

public static class CatalogItemsController
{
    private static readonly Dictionary<string, List<ImportRowDto>> ImportPreviews = new();

    public static IEndpointRouteBuilder MapCatalogItemEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/collections/{collectionId:int}/items", async (
            int collectionId,
            ClaimsPrincipal principal,
            ICatalogItemsService service,
            string? search,
            string? condition,
            string? ownedStatus,
            string? sortBy,
            string? sortDir,
            int? page,
            int? pageSize) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.GetAllAsync(collectionId, userId, search, condition, ownedStatus, sortBy, sortDir, page, pageSize);
            if (result == null) return Results.NotFound();

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("ListCatalogItems")
        .WithOpenApi();

        app.MapGet("/api/collections/{collectionId:int}/items/{id:int}", async (
            int collectionId,
            int id,
            ClaimsPrincipal principal,
            ICatalogItemsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var response = await service.GetByIdAsync(collectionId, id, userId);
            if (response == null) return Results.NotFound();

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("GetCatalogItem")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/items", async (
            int collectionId,
            CreateCatalogItemRequest request,
            ClaimsPrincipal principal,
            ICatalogItemsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, notFound, error) = await service.CreateAsync(collectionId, userId, request);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Created($"/api/collections/{collectionId}/items/{response!.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateCatalogItem")
        .WithOpenApi();

        app.MapPut("/api/collections/{collectionId:int}/items/{id:int}", async (
            int collectionId,
            int id,
            UpdateCatalogItemRequest request,
            ClaimsPrincipal principal,
            ICatalogItemsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var (response, notFound, error) = await service.UpdateAsync(collectionId, id, userId, request);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithName("UpdateCatalogItem")
        .WithOpenApi();

        app.MapDelete("/api/collections/{collectionId:int}/items/{id:int}", async (
            int collectionId,
            int id,
            ClaimsPrincipal principal,
            ICatalogItemsService service) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await service.DeleteAsync(collectionId, id, userId);
            if (result == null) return Results.NotFound();
            if (result == false) return Results.NotFound();

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("DeleteCatalogItem")
        .WithOpenApi();

        app.MapPost("/api/collections/{collectionId:int}/items/{id:int}/image", async (
            int collectionId,
            int id,
            HttpRequest httpRequest,
            ClaimsPrincipal principal,
            ICatalogItemsService service,
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
            var (imageUrl, notFound, error) = await service.UploadImageAsync(collectionId, id, userId, file, webRootPath);
            if (notFound) return Results.NotFound();
            if (error != null) return Results.BadRequest(new { error });

            return Results.Ok(new { imageUrl });
        })
        .RequireAuthorization()
        .WithName("UploadCatalogItemImage")
        .WithOpenApi()
        .DisableAntiforgery();

        // Export endpoint
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
            ImportPreviews[previewId] = rows;

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

            if (!ImportPreviews.TryGetValue(confirmRequest.PreviewId, out var rows))
                return Results.BadRequest(new { error = "Preview not found or expired." });

            ImportPreviews.Remove(confirmRequest.PreviewId);

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

        return app;
    }

    private static async Task<List<ImportRowDto>> ParseCsvFile(IFormFile file, List<CustomFieldDefinition> schema)
    {
        var rows = new List<ImportRowDto>();
        using var reader = new StreamReader(file.OpenReadStream());
        var headerLine = await reader.ReadLineAsync();
        if (string.IsNullOrWhiteSpace(headerLine)) return rows;

        var headers = ParseCsvLine(headerLine);

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

            fieldMap.TryGetValue("Identifier", out var identifier);
            fieldMap.TryGetValue("Name", out var name);
            fieldMap.TryGetValue("Description", out var description);
            fieldMap.TryGetValue("ReleaseDate", out var releaseDate);
            fieldMap.TryGetValue("Manufacturer", out var manufacturer);
            fieldMap.TryGetValue("ReferenceCode", out var referenceCode);
            fieldMap.TryGetValue("Image", out var image);
            fieldMap.TryGetValue("Rarity", out var rarity);

            if (string.IsNullOrWhiteSpace(identifier)) errors.Add("Identifier is required");
            if (string.IsNullOrWhiteSpace(name)) errors.Add("Name is required");

            if (!string.IsNullOrWhiteSpace(releaseDate) &&
                !DateTime.TryParse(releaseDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                errors.Add("ReleaseDate is not a valid date");

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

    private static List<string> ParseCsvLine(string line)
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

    private static string CsvEscape(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
