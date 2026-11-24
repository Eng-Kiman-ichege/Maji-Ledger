using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRentLedgerModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RentCharges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ChargeReference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenancyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BillingPeriod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BillingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RentCharges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RentCharges_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentCharges_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentCharges_Tenancies_TenancyId",
                        column: x => x.TenancyId,
                        principalTable: "Tenancies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentCharges_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RentPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PaymentReference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenancyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountAllocated = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PayerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PayerPhoneNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ReceiptNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RecordedByUserId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReversedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReversalReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RentPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RentPayments_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentPayments_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentPayments_Tenancies_TenancyId",
                        column: x => x.TenancyId,
                        principalTable: "Tenancies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RentPayments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentAllocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    RentPaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RentChargeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AllocatedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AllocatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsReversed = table.Column<bool>(type: "bit", nullable: false),
                    ReversedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReversalReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentAllocations_RentCharges_RentChargeId",
                        column: x => x.RentChargeId,
                        principalTable: "RentCharges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentAllocations_RentPayments_RentPaymentId",
                        column: x => x.RentPaymentId,
                        principalTable: "RentPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TenantCredits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    CreditReference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenancyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourcePaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OriginalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RemainingCredit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    UtilizedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantCredits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantCredits_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantCredits_RentPayments_SourcePaymentId",
                        column: x => x.SourcePaymentId,
                        principalTable: "RentPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantCredits_Tenancies_TenancyId",
                        column: x => x.TenancyId,
                        principalTable: "Tenancies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantCredits_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAllocations_RentChargeId",
                table: "PaymentAllocations",
                column: "RentChargeId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAllocations_RentPaymentId",
                table: "PaymentAllocations",
                column: "RentPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_ApartmentId",
                table: "RentCharges",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_DueDate",
                table: "RentCharges",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_PropertyId",
                table: "RentCharges",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_Status",
                table: "RentCharges",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_Tenancy_BillingPeriod",
                table: "RentCharges",
                columns: new[] { "TenancyId", "BillingPeriod" });

            migrationBuilder.CreateIndex(
                name: "IX_RentCharges_TenantId",
                table: "RentCharges",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UIX_RentCharges_ChargeReference",
                table: "RentCharges",
                column: "ChargeReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_ApartmentId",
                table: "RentPayments",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_PaymentDate",
                table: "RentPayments",
                column: "PaymentDate");

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_PaymentStatus",
                table: "RentPayments",
                column: "PaymentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_PropertyId",
                table: "RentPayments",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_TenancyId",
                table: "RentPayments",
                column: "TenancyId");

            migrationBuilder.CreateIndex(
                name: "IX_RentPayments_TenantId",
                table: "RentPayments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UIX_RentPayments_PaymentReference",
                table: "RentPayments",
                column: "PaymentReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UIX_RentPayments_ReceiptNumber",
                table: "RentPayments",
                column: "ReceiptNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UIX_RentPayments_TransactionReference_Confirmed",
                table: "RentPayments",
                column: "TransactionReference",
                unique: true,
                filter: "[TransactionReference] IS NOT NULL AND [PaymentStatus] = 'Confirmed'");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCredits_PropertyId",
                table: "TenantCredits",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCredits_SourcePaymentId",
                table: "TenantCredits",
                column: "SourcePaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCredits_Status",
                table: "TenantCredits",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCredits_TenancyId",
                table: "TenantCredits",
                column: "TenancyId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCredits_TenantId",
                table: "TenantCredits",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UIX_TenantCredits_CreditReference",
                table: "TenantCredits",
                column: "CreditReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentAllocations");

            migrationBuilder.DropTable(
                name: "TenantCredits");

            migrationBuilder.DropTable(
                name: "RentCharges");

            migrationBuilder.DropTable(
                name: "RentPayments");
        }
    }
}
