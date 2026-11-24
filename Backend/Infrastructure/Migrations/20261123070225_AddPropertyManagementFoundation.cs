using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyManagementFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PropertyCode",
                table: "Properties",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Owners",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuildingCode",
                table: "Buildings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Buildings",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOccupied",
                table: "Apartments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRent",
                table: "Apartments",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "PropertyId",
                table: "Apartments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UnitTypeId",
                table: "Apartments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UnitTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitTypes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "UIX_Properties_PropertyCode",
                table: "Properties",
                column: "PropertyCode",
                unique: true,
                filter: "[PropertyCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Apartments_PropertyId",
                table: "Apartments",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Apartments_UnitTypeId",
                table: "Apartments",
                column: "UnitTypeId");

            migrationBuilder.CreateIndex(
                name: "UIX_UnitTypes_Name",
                table: "UnitTypes",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Apartments_Properties_PropertyId",
                table: "Apartments",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Apartments_UnitTypes_UnitTypeId",
                table: "Apartments",
                column: "UnitTypeId",
                principalTable: "UnitTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Apartments_Properties_PropertyId",
                table: "Apartments");

            migrationBuilder.DropForeignKey(
                name: "FK_Apartments_UnitTypes_UnitTypeId",
                table: "Apartments");

            migrationBuilder.DropTable(
                name: "UnitTypes");

            migrationBuilder.DropIndex(
                name: "UIX_Properties_PropertyCode",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Apartments_PropertyId",
                table: "Apartments");

            migrationBuilder.DropIndex(
                name: "IX_Apartments_UnitTypeId",
                table: "Apartments");

            migrationBuilder.DropColumn(
                name: "PropertyCode",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Owners");

            migrationBuilder.DropColumn(
                name: "BuildingCode",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "IsOccupied",
                table: "Apartments");

            migrationBuilder.DropColumn(
                name: "MonthlyRent",
                table: "Apartments");

            migrationBuilder.DropColumn(
                name: "PropertyId",
                table: "Apartments");

            migrationBuilder.DropColumn(
                name: "UnitTypeId",
                table: "Apartments");
        }
    }
}
