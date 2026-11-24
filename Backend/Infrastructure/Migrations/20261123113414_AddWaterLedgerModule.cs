using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWaterLedgerModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "InstallationDate",
                table: "Meters",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntegrationType",
                table: "Meters",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "LastReading",
                table: "Meters",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReadingDate",
                table: "Meters",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "Meters",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Model",
                table: "Meters",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Meters",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WaterReadings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    WaterMeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreviousReading = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CurrentReading = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Consumption = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ReadingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadingSource = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RecordedByUserId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterReadings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterReadings_Meters_WaterMeterId",
                        column: x => x.WaterMeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WaterTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    TransactionReference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WaterMeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitsPurchased = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ExternalTransactionReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TokenStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TokenValue = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterTransactions_Apartments_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WaterTransactions_Meters_WaterMeterId",
                        column: x => x.WaterMeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WaterTransactions_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WaterTransactions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WaterReadings_ReadingDate",
                table: "WaterReadings",
                column: "ReadingDate");

            migrationBuilder.CreateIndex(
                name: "IX_WaterReadings_WaterMeterId",
                table: "WaterReadings",
                column: "WaterMeterId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_PaymentStatus",
                table: "WaterTransactions",
                column: "PaymentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_PropertyId",
                table: "WaterTransactions",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_TenantId",
                table: "WaterTransactions",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_TokenStatus",
                table: "WaterTransactions",
                column: "TokenStatus");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_TransactionDate",
                table: "WaterTransactions",
                column: "TransactionDate");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_UnitId",
                table: "WaterTransactions",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTransactions_WaterMeterId",
                table: "WaterTransactions",
                column: "WaterMeterId");

            migrationBuilder.CreateIndex(
                name: "UIX_WaterTransactions_ExternalRef_Confirmed",
                table: "WaterTransactions",
                column: "ExternalTransactionReference",
                unique: true,
                filter: "[ExternalTransactionReference] IS NOT NULL AND [PaymentStatus] = 'Confirmed'");

            migrationBuilder.CreateIndex(
                name: "UIX_WaterTransactions_TransactionReference",
                table: "WaterTransactions",
                column: "TransactionReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WaterReadings");

            migrationBuilder.DropTable(
                name: "WaterTransactions");

            migrationBuilder.DropColumn(
                name: "InstallationDate",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "IntegrationType",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "LastReading",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "LastReadingDate",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "Model",
                table: "Meters");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Meters");
        }
    }
}
