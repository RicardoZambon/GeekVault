using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;

namespace GeekVault.Api.Services.Vault;

public class CollectionTypesService : ICollectionTypesService
{
    private readonly ICollectionTypesRepository _repository;
    private readonly ICatalogItemsRepository _catalogItemsRepository;
    private static readonly HashSet<string> ValidFieldTypes = new() { "text", "number", "date", "enum", "boolean", "image_url" };

    public CollectionTypesService(ICollectionTypesRepository repository, ICatalogItemsRepository catalogItemsRepository)
    {
        _repository = repository;
        _catalogItemsRepository = catalogItemsRepository;
    }

    public async Task<List<CollectionTypeResponse>> GetAllAsync(string userId)
    {
        var types = await _repository.GetByUserIdAsync(userId);
        return types.Select(ct => MapToResponse(ct)).ToList();
    }

    public async Task<CollectionTypeResponse?> GetByIdAsync(int id, string userId)
    {
        var ct = await _repository.GetByIdAndUserIdAsync(id, userId);
        return ct == null ? null : MapToResponse(ct);
    }

    public async Task<(CollectionTypeResponse? Response, string? Error)> CreateAsync(string userId, CreateCollectionTypeRequest request)
    {
        var validationError = ValidateCustomFields(request.CustomFields);
        if (validationError != null) return (null, validationError);

        var ct = new CollectionType
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon,
            CustomFieldSchema = request.CustomFields?.Select(f => new CustomFieldDefinition
            {
                Name = f.Name,
                Type = f.Type,
                Required = f.Required,
                Options = f.Options
            }).ToList() ?? new()
        };

        await _repository.AddAsync(ct);
        await _repository.SaveChangesAsync();

        return (MapToResponse(ct), null);
    }

    public async Task<(CollectionTypeResponse? Response, string? Error)> UpdateAsync(int id, string userId, UpdateCollectionTypeRequest request)
    {
        var ct = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (ct == null) return (null, null);

        var validationError = ValidateCustomFields(request.CustomFields);
        if (validationError != null) return (null, validationError);

        ct.Name = request.Name ?? ct.Name;
        ct.Description = request.Description;
        ct.Icon = request.Icon;
        if (request.CustomFields != null)
        {
            var oldFieldNames = ct.CustomFieldSchema.Select(f => f.Name).ToHashSet();
            var newFieldNames = request.CustomFields.Select(f => f.Name).ToHashSet();
            var removedFieldNames = oldFieldNames.Except(newFieldNames).ToHashSet();

            ct.CustomFieldSchema = request.CustomFields.Select(f => new CustomFieldDefinition
            {
                Name = f.Name,
                Type = f.Type,
                Required = f.Required,
                Options = f.Options
            }).ToList();

            // Clean up orphaned custom field values from catalog items
            if (removedFieldNames.Count > 0)
            {
                var items = await _catalogItemsRepository.GetByCollectionTypeIdAsync(ct.Id);
                foreach (var item in items)
                {
                    item.CustomFieldValues = item.CustomFieldValues
                        .Where(fv => !removedFieldNames.Contains(fv.Name))
                        .ToList();
                }
                await _catalogItemsRepository.SaveChangesAsync();
            }
        }

        await _repository.SaveChangesAsync();

        return (MapToResponse(ct), null);
    }

    public async Task<bool> DeleteAsync(int id, string userId)
    {
        var ct = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (ct == null) return false;

        _repository.Remove(ct);
        await _repository.SaveChangesAsync();

        return true;
    }

    private static string? ValidateCustomFields(List<CustomFieldDto>? customFields)
    {
        if (customFields == null) return null;
        if (customFields.Count > 10) return "Maximum of 10 custom fields allowed";
        if (customFields.Any(f => !ValidFieldTypes.Contains(f.Type)))
            return $"Invalid field type. Supported types: {string.Join(", ", ValidFieldTypes)}";
        return null;
    }

    private static CollectionTypeResponse MapToResponse(CollectionType ct) =>
        new(ct.Id, ct.Name, ct.Description, ct.Icon,
            ct.CustomFieldSchema.Select(f => new CustomFieldDto(f.Name, f.Type, f.Required, f.Options)).ToList());
}
