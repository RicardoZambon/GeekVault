using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync(string userId);
}
