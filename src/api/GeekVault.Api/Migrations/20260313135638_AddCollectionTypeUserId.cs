using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeekVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectionTypeUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "CollectionTypes",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionTypes_UserId",
                table: "CollectionTypes",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CollectionTypes_AspNetUsers_UserId",
                table: "CollectionTypes",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CollectionTypes_AspNetUsers_UserId",
                table: "CollectionTypes");

            migrationBuilder.DropIndex(
                name: "IX_CollectionTypes_UserId",
                table: "CollectionTypes");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CollectionTypes");
        }
    }
}
