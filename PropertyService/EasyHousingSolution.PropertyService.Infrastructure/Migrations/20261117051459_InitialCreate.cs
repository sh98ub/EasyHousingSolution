using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EasyHousingSolution.PropertyService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "City",
                columns: table => new
                {
                    CityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CityName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    StateId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_City", x => x.CityId);
                });

            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    ImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    Image = table.Column<string>(type: "varchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.ImageId);
                });

            migrationBuilder.CreateTable(
                name: "Property",
                columns: table => new
                {
                    PropertyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    PropertyType = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false),
                    PropertyOption = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true),
                    Address = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: false),
                    PriceRange = table.Column<decimal>(type: "money", nullable: false),
                    InitialDeposit = table.Column<decimal>(type: "money", nullable: false),
                    Landmark = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeactivationReason = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true),
                    SellerId = table.Column<int>(type: "int", nullable: false),
                    CityId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Property", x => x.PropertyId);
                });

            migrationBuilder.CreateTable(
                name: "State",
                columns: table => new
                {
                    StateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StateName = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_State", x => x.StateId);
                });

            migrationBuilder.InsertData(
                table: "City",
                columns: new[] { "CityId", "CityName", "StateId" },
                values: new object[,]
                {
                    { 1, "Mumbai", 1 },
                    { 2, "Pune", 1 },
                    { 3, "Bengaluru", 2 },
                    { 4, "New Delhi", 3 },
                    { 5, "Gurgaon", 3 },
                    { 6, "Hyderabad", 4 }
                });

            migrationBuilder.InsertData(
                table: "Images",
                columns: new[] { "ImageId", "Image", "PropertyId" },
                values: new object[,]
                {
                    { 1, "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%2305203c'/><text x='50%' y='50%' font-size='20' fill='%23ffffff' text-anchor='middle'>Sobha Dream Acres Exterior</text></svg>", 1 },
                    { 2, "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%23008cff'/><text x='50%' y='50%' font-size='20' fill='%23ffffff' text-anchor='middle'>Prestige Villa Garden</text></svg>", 2 },
                    { 3, "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%2310b981'/><text x='50%' y='50%' font-size='20' fill='%23ffffff' text-anchor='middle'>Hiranandani Lake View</text></svg>", 3 }
                });

            migrationBuilder.InsertData(
                table: "Property",
                columns: new[] { "PropertyId", "Address", "CityId", "DeactivationReason", "Description", "InitialDeposit", "IsActive", "Landmark", "PriceRange", "PropertyName", "PropertyOption", "PropertyType", "SellerId" },
                values: new object[,]
                {
                    { 1, "Tower 4, Panathur Road", 3, null, "Modern luxury 3BHK flat with Italian kitchen, wooden flooring, and clubhouse.", 0m, true, "Outer Ring Road", 8500000m, "Sobha Dream Acres 3BHK", "Sell", "Apartment", 1 },
                    { 2, "Villa 18, ECC Road", 3, null, "Gated triplex villa with private lawn, home theater room, and solar heating.", 0m, true, "Hope Farm", 22000000m, "Prestige Silver Oak Villa", "Sell", "Villa", 1 },
                    { 3, "Castle Rock, Central Ave", 1, null, "Semi-furnished elegant 2BHK with lake view, granite tops, split ACs, and piped gas.", 150000m, true, "Powai Lake", 55000m, "Hiranandani Lakeview 2BHK", "Rent", "Apartment", 2 },
                    { 4, "Building 10, DLF Phase 2", 5, null, "Plug-and-play office with 40 workstations, 2 conference rooms, and 100% backup.", 400000m, true, "Cyber City Metro", 135000m, "DLF Cyber City Tech Suite", "Rent", "Commercial", 1 },
                    { 5, "Park Tower, Worli Marg", 1, null, "Ultra-luxurious high-rise with Arabian Sea view and 7-tier security.", 0m, true, "Worli Sea Face", 37500000m, "Lodha Park Sky Residence 4BHK", "Sell", "Apartment", 2 },
                    { 6, "Silpa Gram Road", 6, null, "Contemporary architectural villa with elevator, pool, and smart home fixtures.", 0m, true, "Cyber Towers", 19500000m, "My Home Bhooja Elite Villa", "Sell", "Villa", 3 },
                    { 7, "Sector 43, Expressway", 4, null, "Forest-themed residence surrounded by 600 trees, infinity pool, and squash court.", 76000m, true, "Golf Course Metro", 38000m, "Godrej Woods Green Valley 3BHK", "Rent", "Apartment", 2 },
                    { 8, "Plot 42, Devanahalli", 3, null, "Approved residential villa plot with clear title, borewell water, and wide roads.", 0m, false, "Near Airport Road", 4500000m, "Green Meadows Residential Plot", "Sell", "Plot", 1 },
                    { 9, "Flat 204, Viman Nagar", 2, "Incomplete property ownership documentation submitted by seller.", "Studio 1BHK close to airport and tech parks.", 50000m, false, "Near Phoenix Mall", 22000m, "Sunrise Towers 1BHK", "Rent", "Apartment", 2 }
                });

            migrationBuilder.InsertData(
                table: "State",
                columns: new[] { "StateId", "StateName" },
                values: new object[,]
                {
                    { 1, "Maharashtra" },
                    { 2, "Karnataka" },
                    { 3, "Delhi NCR" },
                    { 4, "Telangana" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "City");

            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropTable(
                name: "Property");

            migrationBuilder.DropTable(
                name: "State");
        }
    }
}
