using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeekVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlistItemSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "Vault",
                table: "WishlistItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "Vault",
                table: "WishlistItems");
        }
    }
}
