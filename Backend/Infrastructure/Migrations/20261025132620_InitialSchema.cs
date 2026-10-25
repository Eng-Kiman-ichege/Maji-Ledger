using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MajiLedger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Owners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    NationalId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    KraPin = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Owners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Properties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PhysicalAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    County = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Town = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Properties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    NationalId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TransactionAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PerformedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionAuditLogs", x => x.Id);
                    table.CheckConstraint("CK_TransactionAuditLogs_EntityType", "[EntityType] <> ''");
                });

            migrationBuilder.CreateTable(
                name: "ApplicationUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    OwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApplicationUsers_Owners_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Buildings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FloorCount = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buildings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buildings_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentProviderConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProviderType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BusinessShortCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EnvironmentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentProviderConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentProviderConfigs_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PropertyOwnerships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    OwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyOwnerships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyOwnerships_Owners_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyOwnerships_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WaterTariffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BillingCycle = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BaseCharge = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    UnitRate = table.Column<decimal>(type: "decimal(10,4)", nullable: false),
                    IsTiered = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterTariffs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterTariffs_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PropertyAccesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ApplicationUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GrantedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyAccesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyAccesses_ApplicationUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PropertyAccesses_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Apartments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Floor = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Apartments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Apartments_Buildings_BuildingId",
                        column: x => x.BuildingId,
                        principalTable: "Buildings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TariffTiers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    TariffId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TierOrder = table.Column<int>(type: "int", nullable: false),
                    FromUnits = table.Column<decimal>(type: "decimal(10,3)", nullable: false),
                    ToUnits = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    RatePerUnit = table.Column<decimal>(type: "decimal(10,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TariffTiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TariffTiers_WaterTariffs_TariffId",
                        column: x => x.TariffId,
                        principalTable: "WaterTariffs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Meters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CurrentApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TariffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Meters_Apartments_CurrentApartmentId",
                        column: x => x.CurrentApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Meters_WaterTariffs_TariffId",
                        column: x => x.TariffId,
                        principalTable: "WaterTariffs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Tenancies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenancies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tenancies_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tenancies_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MeterAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UnassignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssignedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeterAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeterAssignments_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MeterAssignments_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MeterReadings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReadingValue = table.Column<decimal>(type: "decimal(12,3)", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RecordedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeterReadings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeterReadings_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QrCodeRegistrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentProviderConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublicToken = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RevokedReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QrCodeRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QrCodeRegistrations_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QrCodeRegistrations_PaymentProviderConfigs_PaymentProviderConfigId",
                        column: x => x.PaymentProviderConfigId,
                        principalTable: "PaymentProviderConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SharedMeterBillingPoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AllocationFraction = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedMeterBillingPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SharedMeterBillingPoints_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SharedMeterBillingPoints_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QrCodeRegistrationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PaymentProviderConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CustomerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RequestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProviderCheckoutId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    InitiatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentAttempts_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentAttempts_PaymentProviderConfigs_PaymentProviderConfigId",
                        column: x => x.PaymentProviderConfigId,
                        principalTable: "PaymentProviderConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentAttempts_QrCodeRegistrations_QrCodeRegistrationId",
                        column: x => x.QrCodeRegistrationId,
                        principalTable: "QrCodeRegistrations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "QrCodeAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    QrCodeRegistrationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PerformedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QrCodeAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QrCodeAuditLogs_QrCodeRegistrations_QrCodeRegistrationId",
                        column: x => x.QrCodeRegistrationId,
                        principalTable: "QrCodeRegistrations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PaymentAttemptId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderRef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AmountConfirmed = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "KES"),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_PaymentAttempts_PaymentAttemptId",
                        column: x => x.PaymentAttemptId,
                        principalTable: "PaymentAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WaterPurchases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    PaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TariffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AmountApplied = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitsCalculated = table.Column<decimal>(type: "decimal(10,4)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterPurchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterPurchases_Meters_MeterId",
                        column: x => x.MeterId,
                        principalTable: "Meters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WaterPurchases_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WaterPurchases_WaterTariffs_TariffId",
                        column: x => x.TariffId,
                        principalTable: "WaterTariffs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TokenGenerationAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    WaterPurchaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttemptNumber = table.Column<int>(type: "int", nullable: false),
                    StsRequestPayload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StsResponsePayload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Succeeded = table.Column<bool>(type: "bit", nullable: false),
                    FailureReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AttemptedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenGenerationAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenGenerationAttempts_WaterPurchases_WaterPurchaseId",
                        column: x => x.WaterPurchaseId,
                        principalTable: "WaterPurchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WaterTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    WaterPurchaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StsToken = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    StsRequestRef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterTokens_WaterPurchases_WaterPurchaseId",
                        column: x => x.WaterPurchaseId,
                        principalTable: "WaterPurchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SmsDeliveryRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    WaterTokenId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MessageBody = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    GatewayRef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsDeliveryRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SmsDeliveryRecords_WaterTokens_WaterTokenId",
                        column: x => x.WaterTokenId,
                        principalTable: "WaterTokens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Apartments_BuildingId",
                table: "Apartments",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "UIX_Apartments_BuildingId_UnitNumber_Active",
                table: "Apartments",
                columns: new[] { "BuildingId", "UnitNumber" },
                unique: true,
                filter: "[DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_Email",
                table: "ApplicationUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_OwnerId",
                table: "ApplicationUsers",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_PhoneNumber",
                table: "ApplicationUsers",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Buildings_PropertyId",
                table: "Buildings",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "UIX_Buildings_PropertyId_Name_Active",
                table: "Buildings",
                columns: new[] { "PropertyId", "Name" },
                unique: true,
                filter: "[DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MeterAssignments_ApartmentId",
                table: "MeterAssignments",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "UIX_MeterAssignments_MeterId_Active",
                table: "MeterAssignments",
                column: "MeterId",
                unique: true,
                filter: "[UnassignedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MeterReadings_MeterId_ReadAt",
                table: "MeterReadings",
                columns: new[] { "MeterId", "ReadAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Meters_CurrentApartmentId",
                table: "Meters",
                column: "CurrentApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Meters_MeterNumber",
                table: "Meters",
                column: "MeterNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Meters_TariffId",
                table: "Meters",
                column: "TariffId");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_PhoneNumber",
                table: "Owners",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttempts_MeterId",
                table: "PaymentAttempts",
                column: "MeterId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttempts_PaymentProviderConfigId",
                table: "PaymentAttempts",
                column: "PaymentProviderConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttempts_QrCodeRegistrationId",
                table: "PaymentAttempts",
                column: "QrCodeRegistrationId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttempts_Status",
                table: "PaymentAttempts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "UIX_PaymentAttempts_ProviderCheckoutId",
                table: "PaymentAttempts",
                column: "ProviderCheckoutId",
                unique: true,
                filter: "[ProviderCheckoutId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProviderConfigs_PropertyId",
                table: "PaymentProviderConfigs",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "UIX_PaymentProviderConfigs_Property_Provider_Active",
                table: "PaymentProviderConfigs",
                columns: new[] { "PropertyId", "ProviderType", "BusinessShortCode" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "UIX_Payments_PaymentAttemptId",
                table: "Payments",
                column: "PaymentAttemptId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UIX_Payments_ProviderRef",
                table: "Payments",
                column: "ProviderRef",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_County_Town",
                table: "Properties",
                columns: new[] { "County", "Town" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_Name",
                table: "Properties",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyAccesses_PropertyId",
                table: "PropertyAccesses",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "UIX_PropertyAccesses_UserProperty_Active",
                table: "PropertyAccesses",
                columns: new[] { "ApplicationUserId", "PropertyId" },
                unique: true,
                filter: "[RevokedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyOwnerships_OwnerId",
                table: "PropertyOwnerships",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyOwnerships_PropertyId_Active",
                table: "PropertyOwnerships",
                column: "PropertyId",
                filter: "[EffectiveTo] IS NULL");

            migrationBuilder.CreateIndex(
                name: "UIX_PropertyOwnerships_PrimaryOwner_Active",
                table: "PropertyOwnerships",
                columns: new[] { "PropertyId", "Role" },
                unique: true,
                filter: "[Role] = 'PrimaryOwner' AND [EffectiveTo] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_QrCodeAuditLogs_RegistrationId",
                table: "QrCodeAuditLogs",
                column: "QrCodeRegistrationId");

            migrationBuilder.CreateIndex(
                name: "IX_QrCodeRegistrations_PaymentProviderConfigId",
                table: "QrCodeRegistrations",
                column: "PaymentProviderConfigId");

            migrationBuilder.CreateIndex(
                name: "UIX_QrCodeRegistrations_MeterId_Active",
                table: "QrCodeRegistrations",
                column: "MeterId",
                unique: true,
                filter: "[Status] = 'Active'");

            migrationBuilder.CreateIndex(
                name: "UIX_QrCodeRegistrations_PublicToken",
                table: "QrCodeRegistrations",
                column: "PublicToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SharedMeterBillingPoints_ApartmentId",
                table: "SharedMeterBillingPoints",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SharedMeterBillingPoints_MeterId_Active",
                table: "SharedMeterBillingPoints",
                columns: new[] { "MeterId", "ApartmentId" },
                filter: "[EffectiveTo] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SmsDeliveryRecords_GatewayRef",
                table: "SmsDeliveryRecords",
                column: "GatewayRef",
                filter: "[GatewayRef] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SmsDeliveryRecords_WaterTokenId",
                table: "SmsDeliveryRecords",
                column: "WaterTokenId");

            migrationBuilder.CreateIndex(
                name: "UIX_TariffTiers_TariffId_TierOrder",
                table: "TariffTiers",
                columns: new[] { "TariffId", "TierOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenancies_TenantId",
                table: "Tenancies",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UIX_Tenancies_ApartmentId_Active",
                table: "Tenancies",
                column: "ApartmentId",
                unique: true,
                filter: "[Status] = 'Active'");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_PhoneNumber",
                table: "Tenants",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_TokenGenerationAttempts_WaterPurchaseId",
                table: "TokenGenerationAttempts",
                column: "WaterPurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionAuditLogs_Entity",
                table: "TransactionAuditLogs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_TransactionAuditLogs_OccurredAt",
                table: "TransactionAuditLogs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_WaterPurchases_MeterId",
                table: "WaterPurchases",
                column: "MeterId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterPurchases_TariffId",
                table: "WaterPurchases",
                column: "TariffId");

            migrationBuilder.CreateIndex(
                name: "UIX_WaterPurchases_PaymentId",
                table: "WaterPurchases",
                column: "PaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WaterTariffs_Active",
                table: "WaterTariffs",
                column: "IsActive",
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_WaterTariffs_PropertyId",
                table: "WaterTariffs",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "UIX_WaterTokens_StsToken",
                table: "WaterTokens",
                column: "StsToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UIX_WaterTokens_WaterPurchaseId",
                table: "WaterTokens",
                column: "WaterPurchaseId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeterAssignments");

            migrationBuilder.DropTable(
                name: "MeterReadings");

            migrationBuilder.DropTable(
                name: "PropertyAccesses");

            migrationBuilder.DropTable(
                name: "PropertyOwnerships");

            migrationBuilder.DropTable(
                name: "QrCodeAuditLogs");

            migrationBuilder.DropTable(
                name: "SharedMeterBillingPoints");

            migrationBuilder.DropTable(
                name: "SmsDeliveryRecords");

            migrationBuilder.DropTable(
                name: "TariffTiers");

            migrationBuilder.DropTable(
                name: "Tenancies");

            migrationBuilder.DropTable(
                name: "TokenGenerationAttempts");

            migrationBuilder.DropTable(
                name: "TransactionAuditLogs");

            migrationBuilder.DropTable(
                name: "ApplicationUsers");

            migrationBuilder.DropTable(
                name: "WaterTokens");

            migrationBuilder.DropTable(
                name: "Tenants");

            migrationBuilder.DropTable(
                name: "Owners");

            migrationBuilder.DropTable(
                name: "WaterPurchases");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentAttempts");

            migrationBuilder.DropTable(
                name: "QrCodeRegistrations");

            migrationBuilder.DropTable(
                name: "Meters");

            migrationBuilder.DropTable(
                name: "PaymentProviderConfigs");

            migrationBuilder.DropTable(
                name: "Apartments");

            migrationBuilder.DropTable(
                name: "WaterTariffs");

            migrationBuilder.DropTable(
                name: "Buildings");

            migrationBuilder.DropTable(
                name: "Properties");
        }
    }
}
