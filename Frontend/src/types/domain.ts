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
