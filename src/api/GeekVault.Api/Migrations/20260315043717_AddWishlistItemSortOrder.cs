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

            migrationBuilder.Sql(@"
                WITH Ordered AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY CollectionId
                            ORDER BY Priority DESC, Id ASC
                        ) - 1 AS SortOrder
                    FROM [Vault].[WishlistItems]
                )
                UPDATE wi
                SET wi.SortOrder = o.SortOrder
                FROM [Vault].[WishlistItems] AS wi
                INNER JOIN Ordered AS o ON wi.Id = o.Id;
            ");
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
