using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantAndTenancyManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Tenancies",
                newName: "AgreementNotes");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "Tenancies",
                newName: "ExpectedEndDate");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Tenants",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AlternativePhoneNumber",
                table: "Tenants",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MiddleName",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Tenants",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualEndDate",
                table: "Tenancies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillingFrequency",
                table: "Tenancies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Monthly");

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRent",
                table: "Tenancies",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RentPaymentDueDay",
                table: "Tenancies",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "SecurityDeposit",
                table: "Tenancies",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TenancyReference",
                table: "Tenancies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TenancyTenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    TenancyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPrimaryTenant = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenancyTenants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenancyTenants_Tenancies_TenancyId",
                        column: x => x.TenancyId,
                        principalTable: "Tenancies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenancyTenants_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_NationalId",
                table: "Tenants",
                column: "NationalId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_UserId",
                table: "Tenants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UIX_Tenancies_TenancyReference",
                table: "Tenancies",
                column: "TenancyReference",
                unique: true,
                filter: "[TenancyReference] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TenancyTenants_TenantId",
                table: "TenancyTenants",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UIX_TenancyTenants_PrimaryTenant_Active",
                table: "TenancyTenants",
                columns: new[] { "TenancyId", "IsPrimaryTenant" },
                unique: true,
                filter: "[IsPrimaryTenant] = 1 AND [LeftAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "UIX_TenancyTenants_Tenancy_Tenant_Active",
                table: "TenancyTenants",
                columns: new[] { "TenancyId", "TenantId" },
                unique: true,
                filter: "[LeftAt] IS NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_ApplicationUsers_UserId",
                table: "Tenants",
                column: "UserId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_ApplicationUsers_UserId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "TenancyTenants");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_NationalId",
                table: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_UserId",
                table: "Tenants");

            migrationBuilder.DropIndex(
                name: "UIX_Tenancies_TenancyReference",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AlternativePhoneNumber",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "MiddleName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ActualEndDate",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "BillingFrequency",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "MonthlyRent",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "RentPaymentDueDay",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "SecurityDeposit",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "TenancyReference",
                table: "Tenancies");

            migrationBuilder.RenameColumn(
                name: "ExpectedEndDate",
                table: "Tenancies",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "AgreementNotes",
                table: "Tenancies",
                newName: "Notes");
        }
    }
}
