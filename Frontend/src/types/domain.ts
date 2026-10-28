/**
 * Shared TypeScript types for Maji Ledger.
 * Mirrors backend domain models — will be generated from OpenAPI spec in a later phase.
 */

// ─── Enums ─────────────────────────────────────────────
export type MeterStatus = "Active" | "Inactive" | "Suspended" | "Decommissioned";
export type MeterType = "Prepaid" | "Postpaid" | "Shared";
export type TenancyStatus = "Active" | "Ended" | "Suspended";
export type PaymentAttemptStatus = "Initiated" | "Confirmed" | "Failed" | "Expired" | "Reversed";
export type PaymentChannel = "MpesaPaybill" | "AirtelMoneyPaybill" | "ScanToPay" | "Ussd";
export type PropertyType = "Residential" | "Commercial" | "Mixed";
export type TokenStatus = "Issued" | "Delivered" | "DeliveryFailed";

// ─── Property & Building ────────────────────────────────
export interface PropertyDto {
  id: string;
  name: string;
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
