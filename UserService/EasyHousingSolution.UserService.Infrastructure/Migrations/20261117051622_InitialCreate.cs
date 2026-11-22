using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EasyHousingSolution.UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Buyer",
                columns: table => new
                {
                    BuyerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    LastName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "date", nullable: false),
                    PhoneNo = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false),
                    EmailId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buyer", x => x.BuyerId);
                });

            migrationBuilder.CreateTable(
                name: "Seller",
                columns: table => new
                {
                    SellerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    FirstName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    LastName = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: true),
                    DateofBirth = table.Column<DateTime>(type: "date", nullable: false),
                    PhoneNo = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false),
                    Address = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: false),
                    StateId = table.Column<int>(type: "int", nullable: false),
                    CityId = table.Column<int>(type: "int", nullable: false),
                    EmailId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seller", x => x.SellerId);
                });

            migrationBuilder.InsertData(
                table: "Buyer",
                columns: new[] { "BuyerId", "DateOfBirth", "EmailId", "FirstName", "LastName", "PhoneNo" },
                values: new object[,]
                {
                    { 1, new DateTime(1990, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "buyer@demo.com", "Rajesh", "Sharma", "9876543210" },
                    { 2, new DateTime(1994, 8, 22, 0, 0, 0, 0, DateTimeKind.Unspecified), "priya.nair@outlook.com", "Priya", "Nair", "9820067890" }
                });

            migrationBuilder.InsertData(
                table: "Seller",
                columns: new[] { "SellerId", "Address", "CityId", "DateofBirth", "EmailId", "FirstName", "LastName", "PhoneNo", "StateId", "UserName" },
                values: new object[,]
                {
                    { 1, "123 MG Road, Bengaluru", 3, new DateTime(1985, 3, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "seller@demo.com", "Amit", "Patel", "9845012345", 2, "seller@demo.com" },
                    { 2, "45 Worli Sea Face, Mumbai", 1, new DateTime(1988, 11, 4, 0, 0, 0, 0, DateTimeKind.Unspecified), "ananya.d@estates.in", "Ananya", "Deshmukh", "9820054321", 1, "ananya.d@estates.in" },
                    { 3, "78 Jubilee Hills, Hyderabad", 6, new DateTime(1982, 7, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), "vikram.s@realty.com", "Vikram", "Singhania", "9811198765", 4, "vikram.s@realty.com" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Buyer_EmailId",
                table: "Buyer",
                column: "EmailId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Seller_EmailId",
                table: "Seller",
                column: "EmailId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Buyer");

            migrationBuilder.DropTable(
                name: "Seller");
        }
    }
}
