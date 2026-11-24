/**
 * Shared TypeScript types for Maji Ledger.
 * Mirrors backend domain models — will be generated from OpenAPI spec in a later phase.
 */

// ─── Enums ─────────────────────────────────────────────
export type MeterStatus = "Active" | "Inactive" | "Suspended" | "Decommissioned" | "Faulty" | "Disconnected" | "UnderMaintenance";
export type MeterType = "Prepaid" | "Postpaid" | "Shared" | "MonitoringOnly";
export type TenancyStatus = "Active" | "Ended" | "Suspended";
export type PaymentAttemptStatus = "Initiated" | "Confirmed" | "Failed" | "Expired" | "Reversed";
export type PaymentChannel = "MpesaPaybill" | "AirtelMoneyPaybill" | "ScanToPay" | "Ussd";
export type PropertyType = "Residential" | "Commercial" | "Mixed";
export type TokenStatus = "Issued" | "Delivered" | "DeliveryFailed";
export type UserRole = "Admin" | "Owner" | "Manager" | "Staff" | "Tenant";

// ─── Auth ───────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  ownerId?: string;
  authorizedPropertyIds: string[];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  ownerId?: string;
  ownerName?: string;
  assignedProperties: { propertyId: string; propertyName: string; town?: string; county?: string }[];
  createdAt: string;
}


// ─── Property & Building ────────────────────────────────
export interface PropertyDto {
  id: string;
  name: string;
  propertyName?: string;
  type: PropertyType;
  address?: string;
  town?: string;
  county?: string;
  postalCode?: string;
  description?: string;
  isActive: boolean;
  buildingCount: number;
}

export interface BuildingDto {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  floorCount?: number;
  apartmentCount: number;
}

export interface ApartmentDto {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor?: string;
  description?: string;
  isOccupied: boolean;
}

// ─── Meters ─────────────────────────────────────────────
export interface MeterDto {
  id: string;
  meterNumber: string;
  serialNumber?: string;
  maskedIdentifier: string;
  type: MeterType;
  status: MeterStatus;
  currentApartmentId?: string;
  currentUnitNumber?: string;
  hasActiveQrCode: boolean;
}

export interface MeterDetailDto extends MeterDto {
  tariffId?: string;
  tariffName?: string;
  activeQrPublicToken?: string;
}

// ─── Payments ───────────────────────────────────────────
export interface PaymentAttemptDto {
  id: string;
  meterId: string;
  meterNumber: string;
  channel: PaymentChannel;
  customerPhone: string;
  requestedAmount: number;
  status: PaymentAttemptStatus;
  providerCheckoutId?: string;
  failureReason?: string;
  initiatedAt: string;
  expiresAt: string;
  completedAt?: string;
  waterToken?: string;
  unitsIssued?: number;
}

export interface PaymentInitiationDto {
  attemptId: string;
  providerCheckoutId?: string;
  status: PaymentAttemptStatus;
  expiresAt: string;
}

// ─── Scan-to-Pay landing ────────────────────────────────
export interface ScanToPayLandingDto {
  meterId: string;
  maskedMeterIdentifier: string;
  propertyName: string;
  buildingName?: string;
  unitNumber?: string;
  paymentProviderDisplayName: string;
  businessShortCode: string;
  providerType: number;
  baseCharge: number;
  unitRate: number;
  isTiered: boolean;
  tariffName?: string;
}

// ─── Legacy aliases ──────────────────────────────────────
/** @deprecated Use PropertyDto */
export interface Property extends PropertyDto {}
/** @deprecated Use MeterDto */
export interface Meter extends MeterDto {}
/** @deprecated Use PaymentAttemptDto */
export interface WaterTransaction {
  id: string;
  meterId: string;
  channel: PaymentChannel;
  customerPhone: string;
  amountPaid: number;
  unitsCalculated: number;
  stsToken?: string;
  paymentProviderRef?: string;
  paymentStatus: PaymentAttemptStatus;
  tokenStatus: TokenStatus;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
}
export interface ScanToPayInfo {
  qrToken: string;
  propertyName: string;
  buildingName: string;
  unitNumber: string;
  maskedMeterIdentifier: string;
  paymentReference?: string;
}

// ─── Dashboard & Analytics DTOs ───────────────────────────
export interface FinancialSummaryDto {
  grossConfirmedCollections: number;
  totalUnitsPurchased: number;
  confirmedPaymentCount: number;
  pendingAttemptCount: number;
  failedAttemptCount: number;
  expiredAttemptCount: number;
  reversedCount: number;
  tokenIssuedCount: number;
  tokenFailedCount: number;
  smsDeliveredCount: number;
  smsFailedCount: number;
}

export interface ChannelBreakdownDto {
  scanToPayAmount: number;
  scanToPayCount: number;
  paybillAmount: number;
  paybillCount: number;
  airtelAmount: number;
  airtelCount: number;
  ussdAmount: number;
  ussdCount: number;
}

export interface PropertySummaryDto {
  propertyId: string;
  propertyName: string;
  town?: string;
  county?: string;
  isActive: boolean;
  buildingCount: number;
  apartmentCount: number;
  meterCount: number;
  activeQrCount: number;
  confirmedCollections: number;
  unitsPurchased: number;
  confirmedPaymentCount: number;
  pendingCount: number;
  failedCount: number;
}

export interface AdminDashboardDto {
  totalProperties: number;
  activeProperties: number;
  totalBuildings: number;
  totalApartments: number;
  totalMeters: number;
  activeMeters: number;
  activeQrRegistrations: number;
  activeTenancies: number;
  financials: FinancialSummaryDto;
  channelBreakdown: ChannelBreakdownDto;
  propertySummaries: PropertySummaryDto[];
}

export interface OwnerDashboardDto {
  ownerName: string;
  authorizedPropertyCount: number;
  financials: FinancialSummaryDto;
  channelBreakdown: ChannelBreakdownDto;
  propertySummaries: PropertySummaryDto[];
}

export interface QrTraceabilityDto {
  qrRegistrationId: string;
  publicToken: string;
  qrStatus: "Active" | "Disabled" | "Revoked" | number;
  registeredAt: string;
  revokedReason?: string;
  meterId: string;
  meterNumber: string;
  maskedMeterIdentifier: string;
  unitNumber?: string;
  buildingName?: string;
  propertyName: string;
  businessShortCode: string;
  providerDisplayName: string;
  totalPaymentAttempts: number;
  confirmedPayments: number;
  totalConfirmedAmount: number;
  totalUnitsPurchased: number;
  tokenIssuedCount: number;
  tokenFailedCount: number;
  smsDeliveredCount: number;
  smsFailedCount: number;
}

export interface QrAnalyticsResultDto {
  totalRegistrations: number;
  activeRegistrations: number;
  disabledRegistrations: number;
  revokedRegistrations: number;
  totalConfirmedRevenue: number;
  totalUnitsPurchased: number;
  totalPaymentAttempts: number;
  confirmedPayments: number;
  registrations: QrTraceabilityDto[];
}

export interface OwnerDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  nationalIdNumber?: string;
  kraPin?: string;
  isActive: boolean;
}


// ─── Rent Ledger Types ──────────────────────────────────────────────────────

export type RentChargeStatus =
  | "Pending"
  | "PartiallyPaid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export type RentPaymentMethod =
  | "Mpesa"
  | "BankTransfer"
  | "Cash"
  | "Cheque"
  | "Other";

export type RentPaymentStatus =
  | "Pending"
  | "Confirmed"
  | "Failed"
  | "Reversed";

export type TenantCreditStatus =
  | "Active"
  | "FullyUtilized"
  | "Expired"
  | "Refunded";

export interface RentChargeDto {
  id: string;
  chargeReference: string;
  tenancyId: string;
  tenancyReference?: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  apartmentId: string;
  unitNumber: string;
  billingPeriod: string;
  billingDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  outstandingAmount: number;
  status: RentChargeStatus;
  description?: string;
  createdAt: string;
}

export interface PaymentAllocationSummaryDto {
  id: string;
  paymentId: string;
  paymentReference: string;
  receiptNumber: string;
  allocatedAmount: number;
  allocatedAt: string;
  isReversed: boolean;
}

export interface RentChargeDetailDto extends RentChargeDto {
  cancellationReason?: string;
  allocations: PaymentAllocationSummaryDto[];
}

export interface GenerateChargesResultDto {
  generatedCount: number;
  skippedCount: number;
  totalBilled: number;
  chargeReferences: string[];
}

export interface RentPaymentDto {
  id: string;
  paymentReference: string;
  receiptNumber: string;
  tenancyId: string;
  tenancyReference?: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  apartmentId: string;
  unitNumber: string;
  amount: number;
  amountAllocated: number;
  unallocatedAmount: number;
  paymentMethod: RentPaymentMethod;
  transactionReference?: string;
  paymentDate: string;
  payerName?: string;
  payerPhoneNumber?: string;
  paymentStatus: RentPaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface ChargeAllocationDto {
  allocationId: string;
  chargeId: string;
  chargeReference: string;
  billingPeriod: string;
  allocatedAmount: number;
  isReversed: boolean;
}

export interface RentPaymentDetailDto extends RentPaymentDto {
  reversalReason?: string;
  reversedAt?: string;
  allocations: ChargeAllocationDto[];
}

export interface AllocationResultItem {
  chargeReference: string;
  billingPeriod: string;
  allocatedAmount: number;
  chargeStatus: RentChargeStatus;
}

export interface RecordRentPaymentResult {
  paymentId: string;
  paymentReference: string;
  receiptNumber: string;
  totalAllocated: number;
  unallocatedCredit: number;
  allocations: AllocationResultItem[];
}

export type ArrearsAgeBucket =
  | "NotDue"
  | "Current"
  | "Days31to60"
  | "Days61to90"
  | "Over90Days";

export interface ArrearsLineDto {
  chargeId: string;
  chargeReference: string;
  billingPeriod: string;
  dueDate: string;
  outstanding: number;
  daysOverdue: number;
  ageBucket: ArrearsAgeBucket;
}

export interface TenantArrearsDto {
  tenantId: string;
  tenantName: string;
  phoneNumber: string;
  tenancyId: string;
  tenancyReference?: string;
  apartmentId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  totalOutstanding: number;
  notDue: number;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  lines: ArrearsLineDto[];
}

export interface ArrearsReportDto {
  asOf: string;
  tenantCount: number;
  totalOutstanding: number;
  notDue: number;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  tenants: TenantArrearsDto[];
}

export interface StatementLineDto {
  type: "Charge" | "Payment" | "Credit";
  reference: string;
  description?: string;
  billingPeriod: string;
  date: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface TenantStatementDto {
  tenantId: string;
  tenantName: string;
  phoneNumber: string;
  tenancyId: string;
  tenancyReference?: string;
  unitNumber: string;
  propertyName: string;
  startDate: string;
  statementDate: string;
  monthlyRent: number;
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
  lines: StatementLineDto[];
}

export interface MonthlyCollectionDto {
  period: string;
  charged: number;
  collected: number;
}

export interface RentDashboardDto {
  activeTenancies: number;
  totalRentRoll: number;
  collectedThisMonth: number;
  outstandingBalance: number;
  overdueBalance: number;
  tenanciesInArrears: number;
  lastSixMonths: MonthlyCollectionDto[];
}

export interface PrimaryTenantDto {
  tenantId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
}

export interface TenancySummaryDto {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  buildingName: string;
  tenancyReference?: string;
  status: TenancyStatus;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  occupantCount: number;
  primaryTenant: PrimaryTenantDto;
  createdAt: string;
}

// ─── Water Ledger Types ─────────────────────────────────────────────────────

export type MeterIntegrationType = "ApiIntegrated" | "ManualToken" | "MonitoringOnly";

export type WaterTransactionPaymentStatus = "Pending" | "Confirmed" | "Failed" | "Reversed";

export type WaterTransactionTokenStatus = "NotRequired" | "Pending" | "Generated" | "Delivered" | "Failed";

export type WaterPaymentMethod = "Mpesa" | "AirtelMoney" | "BankTransfer" | "Cash" | "Other";

export interface WaterMeterDto {
  id: string;
  meterNumber: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  type: MeterType;
  integrationType: MeterIntegrationType;
  status: MeterStatus;
  currentApartmentId?: string;
  unitNumber?: string;
  propertyId?: string;
  propertyName?: string;
  buildingName?: string;
  installationDate?: string;
  lastReading?: number;
  lastReadingDate?: string;
  notes?: string;
  activeQrCodeToken?: string;
  createdAt: string;
}

export interface MeterAssignmentDto {
  assignmentId: string;
  apartmentId: string;
  unitNumber: string;
  assignedAt: string;
  unassignedAt?: string;
  assignedBy?: string;
}

export interface MeterReadingItemDto {
  readingId: string;
  readingValue: number;
  source: string;
  readAt: string;
  recordedBy?: string;
}

export interface WaterMeterDetailDto extends WaterMeterDto {
  assignmentHistory: MeterAssignmentDto[];
  recentReadings: MeterReadingItemDto[];
}

export interface WaterTransactionDto {
  id: string;
  transactionReference: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  waterMeterId: string;
  meterNumber: string;
  tenantId?: string;
  tenantName?: string;
  amount: number;
  unitsPurchased: number;
  unitPrice: number;
  paymentMethod: WaterPaymentMethod;
  externalTransactionReference?: string;
  phoneNumber: string;
  transactionDate: string;
  paymentStatus: WaterTransactionPaymentStatus;
  tokenStatus: WaterTransactionTokenStatus;
  tokenValue?: string;
  failureReason?: string;
  notes?: string;
  createdAt: string;
}

export interface WaterReadingDto {
  id: string;
  waterMeterId: string;
  meterNumber: string;
  unitNumber?: string;
  propertyName?: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  readingSource: string;
  recordedByUserId?: string;
  notes?: string;
  createdAt: string;
}

export interface PropertyWaterSummaryDto {
  propertyId: string;
  propertyName: string;
  meterCount: number;
  revenue: number;
  unitsSold: number;
  consumption: number;
}

export interface WaterDashboardDto {
  totalRevenue: number;
  totalUnitsSold: number;
  totalConsumption: number;
  totalMeters: number;
  activeMeters: number;
  failedPayments: number;
  pendingTokens: number;
  recentPurchases: WaterTransactionDto[];
  propertyBreakdowns: PropertyWaterSummaryDto[];
}

export interface WaterReconciliationSummaryDto {
  totalWaterRevenue: number;
  confirmedCount: number;
  failedRevenue: number;
  failedCount: number;
  pendingTokensCount: number;
  deliveryFailuresCount: number;
  mpesaTotal: number;
  mpesaCount: number;
  airtelTotal: number;
  airtelCount: number;
  unmatchedOrPendingTransactions: WaterTransactionDto[];
}

export interface ProviderLookupResultDto {
  found: boolean;
  providerReference: string;
  transaction?: WaterTransactionDto;
  message?: string;
}

export interface TariffTierDto {
  id: string;
  tierOrder: number;
  fromUnits: number;
  toUnits?: number;
  ratePerUnit: number;
}

export interface WaterTariffDto {
  id: string;
  propertyId?: string;
  name: string;
  description?: string;
  billingCycle: string;
  baseCharge: number;
  unitRate: number;
  isTiered: boolean;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  tiers: TariffTierDto[];
}

export interface BuildingSummaryDto {
  id: string;
  propertyId: string;
  name: string;
  buildingCode?: string;
  floorCount?: number;
  totalFloors?: number;
  description?: string;
  isActive: boolean;
  unitCount: number;
  apartmentCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UnitDetailDto {
  id: string;
  propertyId: string;
  propertyName?: string;
  buildingId: string;
  buildingName: string;
  unitTypeId?: string;
  unitTypeName?: string;
  unitNumber: string;
  floor?: string;
  description?: string;
  monthlyRent: number;
  isOccupied: boolean;
  isActive: boolean;
  currentTenantName?: string;
  assignedMeterNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TenancyOccupantDto {
  tenantId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  isPrimaryTenant: boolean;
  joinedAt: string;
}

export interface TenancyDetailDto {
  id: string;
  unitId: string;
  unitNumber: string;
  apartmentUnitNumber?: string;
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  tenancyReference?: string;
  status: TenancyStatus;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  rentPaymentDueDay: number;
  agreementNotes?: string;
  primaryTenant: PrimaryTenantDto;
  primaryTenantName?: string;
  primaryTenantPhone?: string;
  primaryTenantEmail?: string;
  occupants?: TenancyOccupantDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface LandlordAssignmentDto {
  assignmentId: string;
  propertyId: string;
  propertyName: string;
  ownershipRole: string;
  assignedAt: string;
}

export interface LandlordDetailDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
  kraPin?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  assignedProperties: LandlordAssignmentDto[];
}

// ─── Maintenance & Landlord Portal ─────────────────────────────
export type MaintenanceCategory =
  | "Plumbing"
  | "Electrical"
  | "Structural"
  | "Painting"
  | "Security"
  | "Cleaning"
  | "Appliance"
  | "Landscaping"
  | "Other";

export type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";

export type MaintenanceStatus =
  | "Submitted"
  | "Acknowledged"
  | "InProgress"
  | "OnHold"
  | "Completed"
  | "Cancelled";

export interface MaintenanceRequestDto {
  id: string;
  propertyId: string;
  propertyName: string;
  buildingId?: string;
  buildingName?: string;
  apartmentId?: string;
  unitNumber?: string;
  tenancyId?: string;
  tenantId?: string;
  tenantName?: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  submittedAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  cancelledReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "General"
  | "RentCharge"
  | "RentPayment"
  | "RentArrear"
  | "WaterPurchase"
  | "WaterToken"
  | "MaintenanceUpdate"
  | "TenancyCreated"
  | "TenancyEnded"
  | "SystemAlert";

export interface AppNotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface LandlordPortalPropertyKpi {
  totalProperties: number;
  activeProperties: number;
  totalBuildings: number;
  totalApartments: number;
  occupiedApartments: number;
  vacantApartments: number;
  occupancyRate: number;
}

export interface LandlordPortalRentKpi {
  monthlyExpectedRent: number;
  monthlyCollected: number;
  monthlyOutstanding: number;
  activeTenancies: number;
  tenantsWithArrears: number;
  totalArrears: number;
}

export interface LandlordPortalWaterKpi {
  waterRevenue: number;
  unitsPurchased: number;
  activeMeters: number;
  pendingTokens: number;
}

export interface LandlordPortalMaintenanceKpi {
  openRequests: number;
  inProgressRequests: number;
  completedThisPeriod: number;
  criticalRequests: number;
}

export interface LandlordPortalDashboardDto {
  ownerName: string;
  propertyStats: LandlordPortalPropertyKpi;
  rentStats: LandlordPortalRentKpi;
  waterStats: LandlordPortalWaterKpi;
  maintenanceStats: LandlordPortalMaintenanceKpi;
  unreadNotifications: number;
}

export interface LandlordPortalPropertyDto {
  id: string;
  name: string;
  address?: string;
  town?: string;
  county?: string;
  type: PropertyType;
  isActive: boolean;
  buildingCount: number;
  apartmentCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeTenancies: number;
  monthlyExpectedRent: number;
  waterRevenue: number;
  activeMeters: number;
}

export interface LandlordPortalPropertyDetailDto {
  id: string;
  name: string;
  description?: string;
  address?: string;
  town?: string;
  county?: string;
  type: PropertyType;
  isActive: boolean;
  buildingCount: number;
  apartmentCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeTenancies: number;
  monthlyExpectedRent: number;
  monthlyRentCollected: number;
  monthlyRentOutstanding: number;
  waterRevenue: number;
  openMaintenanceRequests: number;
}

export interface LandlordStatementLineDto {
  period: string;
  expectedRent: number;
  collectedRent: number;
  outstandingRent: number;
  waterRevenue: number;
  maintenanceCost: number;
  netIncome: number;
}

export interface LandlordStatementDto {
  propertyId?: string;
  propertyName?: string;
  from: string;
  to: string;
  totalExpectedRent: number;
  totalCollectedRent: number;
  totalOutstandingRent: number;
  totalWaterRevenue: number;
  totalMaintenanceCost: number;
  netIncome: number;
  monthlyBreakdown: LandlordStatementLineDto[];
}

// ─── Final Phase: Tenant Portal ──────────────────────────
export interface TenantRecentPaymentDto {
  id: string;
  reference: string;
  amount: number;
  paidAt: string;
  method: string;
  receiptNumber?: string;
}

export interface TenantRecentWaterPurchaseDto {
  id: string;
  reference: string;
  amount: number;
  unitsPurchased: number;
  tokenValue?: string;
  date: string;
}

export interface TenantPortalDashboardDto {
  tenantId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  tenancyId?: string;
  tenancyReference?: string;
  tenancyStatus?: TenancyStatus;
  propertyName?: string;
  buildingName?: string;
  unitNumber?: string;
  monthlyRent: number;
  rentDueDay: number;
  startDate?: string;
  outstandingBalance: number;
  totalRentPaid: number;
  waterMeterNumber?: string;
  openMaintenanceCount: number;
  recentPayments: TenantRecentPaymentDto[];
  recentWaterPurchases: TenantRecentWaterPurchaseDto[];
}

export interface TenantProfileDto {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  alternativePhoneNumber?: string;
  email?: string;
  nationalId?: string;
  address?: string;
}

export interface UpdateTenantProfileRequest {
  phoneNumber: string;
  alternativePhoneNumber?: string;
  email?: string;
  address?: string;
}

// ─── Final Phase: Financial Reconciliation ───────────────
export type ReconciliationLedgerType = "Rent" | "Water" | "Consolidated";
export type ReconciliationStatus = "Draft" | "Matched" | "DiscrepanciesFound" | "Resolved";
export type DiscrepancyStatus = "Pending" | "Resolved" | "Ignored";
export type SettingCategory = "General" | "PaymentGateway" | "SmsGateway" | "Billing" | "Security";

export interface ReconciliationSessionDto {
  id: string;
  ledgerType: ReconciliationLedgerType;
  propertyId?: string;
  propertyName?: string;
  periodFrom: string;
  periodTo: string;
  status: ReconciliationStatus;
  totalInternalAmount: number;
  totalExternalAmount: number;
  discrepancyAmount: number;
  matchedCount: number;
  unmatchedCount: number;
  reconciledBy: string;
  reconciledAt?: string;
  notes?: string;
  createdAt: string;
}

export interface DiscrepancyDto {
  id: string;
  sessionId: string;
  transactionReference: string;
  internalAmount: number;
  externalAmount: number;
  discrepancyReason: string;
  status: DiscrepancyStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ExternalStatementItem {
  reference: string;
  amount: number;
  date: string;
  channel?: string;
}

export interface ConsolidatedFinancialReportDto {
  from: string;
  to: string;
  totalRentBilled: number;
  totalRentCollected: number;
  totalRentOutstanding: number;
  totalWaterRevenue: number;
  totalUnitsVended: number;
  totalMaintenanceExpense: number;
  netOperatingIncome: number;
  totalConfirmedPayments: number;
  totalFailedPayments: number;
}

export interface ProcessReconciliationRequest {
  ledgerType: ReconciliationLedgerType;
  propertyId?: string;
  periodFrom: string;
  periodTo: string;
  externalItems: ExternalStatementItem[];
  notes?: string;
}

export interface ResolveDiscrepancyRequest {
  resolutionNotes: string;
  action: "Resolve" | "Ignore";
}

// ─── Final Phase: Admin Control Centre ───────────────────
export interface AuditLogSummaryDto {
  id: string;
  entityType: string;
  eventType: string;
  performedBy: string;
  occurredAt: string;
  notes?: string;
}

export interface AdminExecutiveDashboardDto {
  totalLandlords: number;
  totalTenants: number;
  totalProperties: number;
  totalBuildings: number;
  totalApartments: number;
  occupiedApartments: number;
  vacantApartments: number;
  activeTenancies: number;
  totalRentCollected: number;
  totalRentOutstanding: number;
  totalWaterRevenue: number;
  totalWaterUnitsPurchased: number;
  activeWaterMeters: number;
  pendingWaterTransactions: number;
  failedWaterTransactions: number;
  outstandingMaintenanceRequests: number;
  recentActivities: AuditLogSummaryDto[];
}

export interface SystemSettingDto {
  id: string;
  key: string;
  value: string;
  category: SettingCategory;
  description: string;
  isEncrypted: boolean;
  updatedBy: string;
  updatedAt?: string;
}

export interface IntegrationStatusDto {
  name: string;
  type: string;
  status: string;
  environment?: string;
  details?: string;
  lastChecked: string;
}

// ─── Final Phase: Analytics & BI ─────────────────────────
export interface PropertyComparisonItemDto {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  expectedRent: number;
  collectedRent: number;
  outstandingRent: number;
  waterRevenue: number;
  maintenanceExpense: number;
  netIncome: number;
}

export interface AnalyticsOverviewDto {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  overallOccupancyRate: number;
  totalRentCollected: number;
  totalRentOutstanding: number;
  rentCollectionRate: number;
  totalWaterRevenue: number;
  totalWaterVolume: number;
  totalMaintenanceCost: number;
  propertyComparison: PropertyComparisonItemDto[];
}


