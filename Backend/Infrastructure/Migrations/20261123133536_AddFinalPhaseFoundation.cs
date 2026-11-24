using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinalPhaseFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "ApplicationUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReconciliationSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LedgerType = table.Column<int>(type: "int", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PeriodFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodTo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalInternalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalExternalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiscrepancyAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MatchedCount = table.Column<int>(type: "int", nullable: false),
                    UnmatchedCount = table.Column<int>(type: "int", nullable: false),
                    ReconciledBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ReconciledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReconciliationSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReconciliationSessions_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsEncrypted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReconciliationDiscrepancies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    InternalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExternalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiscrepancyReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ResolvedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReconciliationDiscrepancies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReconciliationDiscrepancies_ReconciliationSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "ReconciliationSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_TenantId",
                table: "ApplicationUsers",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancies_SessionId",
                table: "ReconciliationDiscrepancies",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancies_Status",
                table: "ReconciliationDiscrepancies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancies_TransactionReference",
                table: "ReconciliationDiscrepancies",
                column: "TransactionReference");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationSessions_CreatedAt",
                table: "ReconciliationSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationSessions_PropertyId",
                table: "ReconciliationSessions",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationSessions_Status",
                table: "ReconciliationSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_Category",
                table: "SystemSettings",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_Key",
                table: "SystemSettings",
                column: "Key",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ApplicationUsers_Tenants_TenantId",
                table: "ApplicationUsers",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApplicationUsers_Tenants_TenantId",
                table: "ApplicationUsers");

            migrationBuilder.DropTable(
                name: "ReconciliationDiscrepancies");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "ReconciliationSessions");

            migrationBuilder.DropIndex(
                name: "IX_ApplicationUsers_TenantId",
                table: "ApplicationUsers");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "ApplicationUsers");
        }
    }
}
