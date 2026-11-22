using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EasyHousingSolution.IdentityService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    Password = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    UserType = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserName);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserName", "Password", "UserType" },
                values: new object[,]
                {
                    { "admin@easysolution.com", "AdminPassword123!", "Admin" },
                    { "ananya.d@estates.in", "SellerPassword123!", "Seller" },
                    { "buyer@demo.com", "BuyerPassword123!", "Buyer" },
                    { "priya.nair@outlook.com", "BuyerPassword123!", "Buyer" },
                    { "seller@demo.com", "SellerPassword123!", "Seller" },
                    { "vikram.s@realty.com", "SellerPassword123!", "Seller" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
