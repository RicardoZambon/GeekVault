using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeekVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogItemSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "Vault",
                table: "CatalogItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                WITH OrderedItems AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY CollectionId
                            ORDER BY Id
                        ) - 1 AS NewSortOrder
                    FROM [Vault].[CatalogItems]
                )
                UPDATE ci
                SET ci.SortOrder = oi.NewSortOrder
                FROM [Vault].[CatalogItems] AS ci
                INNER JOIN OrderedItems AS oi ON ci.Id = oi.Id;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "Vault",
                table: "CatalogItems");
        }
    }
}
