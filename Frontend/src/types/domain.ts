/**
 * Shared TypeScript types for Maji Ledger.
 * Mirrors backend domain models — will be generated from OpenAPI spec in a later phase.
 */

// ─── Enums ─────────────────────────────────────────────
export type MeterStatus = "Active" | "Inactive" | "Suspended" | "Decommissioned";
export type TenancyStatus = "Active" | "Ended" | "Suspended";
export type PaymentStatus = "Pending" | "Confirmed" | "Failed" | "Reversed";
export type TokenStatus = "Issued" | "Delivered" | "DeliveryFailed";
export type PaymentChannel = "MpesaPaybill" | "AirtelMoneyPaybill" | "ScanToPay" | "Ussd";
export type PropertyType = "Residential" | "Commercial" | "Mixed";

// ─── Core Entities ──────────────────────────────────────
export interface Property {
  id: string;
  name: string;
  description?: string;
  type: PropertyType;
  physicalAddress?: string;
  county?: string;
  town?: string;
  createdAt: string;
}

export interface Building {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  floorCount?: number;
}

export interface Apartment {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor?: string;
  description?: string;
}

export interface Meter {
  id: string;
  meterNumber: string;
  serialNumber?: string;
  apartmentId?: string;
  maskedIdentifier: string;
  status: MeterStatus;
}

export interface WaterTransaction {
  id: string;
  meterId: string;
  channel: PaymentChannel;
  customerPhone: string;
  amountPaid: number;
  unitsCalculated: number;
  stsToken?: string;
  paymentProviderRef?: string;
  paymentStatus: PaymentStatus;
  tokenStatus: TokenStatus;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Scan-to-Pay public view ─────────────────────────────
export interface ScanToPayInfo {
  qrToken: string;
  propertyName: string;
  buildingName: string;
  unitNumber: string;
  maskedMeterIdentifier: string;
  paymentReference?: string;
}

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

export interface PaymentInitiationDto {
  attemptId: string;
  providerCheckoutId?: string;
  status: "Initiated" | "Confirmed" | "Failed" | "Expired" | "Reversed";
  expiresAt: string;
}

export interface PaymentAttemptDto {
  id: string;
  meterId: string;
  meterNumber: string;
  channel: string;
  customerPhone: string;
  requestedAmount: number;
  status: "Initiated" | "Confirmed" | "Failed" | "Expired" | "Reversed";
  providerCheckoutId?: string;
  failureReason?: string;
  initiatedAt: string;
  expiresAt: string;
  completedAt?: string;
  waterToken?: string;
  unitsIssued?: number;
}
