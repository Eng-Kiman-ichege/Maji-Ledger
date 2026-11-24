"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { RentPaymentDto, RecordRentPaymentResult, TenancySummaryDto } from "@/types/domain";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Receipt,
  User,
  Calendar,
} from "lucide-react";

export default function RentPaymentsPage() {
  const [payments, setPayments] = useState<RentPaymentDto[]>([]);
  const [activeTenancies, setActiveTenancies] = useState<TenancySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  // Record Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState<RecordRentPaymentResult | null>(null);

  // Form fields
  const [selectedTenancyId, setSelectedTenancyId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Mpesa");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [txRef, setTxRef] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Reverse modal
  const [reversingPayment, setReversingPayment] = useState<RentPaymentDto | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    loadPayments();
    loadTenancies();
  }, [methodFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get<RentPaymentDto[]>("/api/v1/rent/payments");
      setPayments(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenancies = async () => {
    try {
      const res = await api.get<TenancySummaryDto[]>("/api/v1/tenancies/active");
      setActiveTenancies(res);
    } catch {}
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenancyId || !amount) return;

    setSubmitting(true);
    setActionError("");
    setPaymentSuccess(null);

    try {
      const res = await api.post<RecordRentPaymentResult>("/api/v1/rent/payments", {
        tenancyId: selectedTenancyId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate).toISOString(),
        transactionReference: txRef.trim() || null,
        payerName: payerName.trim() || null,
        payerPhoneNumber: payerPhone.trim() || null,
        notes: notes.trim() || null,
      });

      setPaymentSuccess(res);
      await loadPayments();
    } catch (err: any) {
      setActionError(err?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment || !reversalReason) return;

    setReversing(true);
    setActionError("");

    try {
      await api.post(`/api/v1/rent/payments/${reversingPayment.id}/reverse`, {
        reason: reversalReason,
      });
      setReversingPayment(null);
      setReversalReason("");
      await loadPayments();
    } catch (err: any) {
      setActionError(err?.message || "Failed to reverse payment");
    } finally {
      setReversing(false);
    }
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentReference.toLowerCase().includes(search.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(search.toLowerCase())) ||
      p.propertyName.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = !methodFilter || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Rent Payments & Collections
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            Record tenant rent receipts, manage FIFO debt allocations, and track credits.
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setPaymentSuccess(null);
            setActionError("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "var(--gradient-brand, #0284c7)",
            border: "none",
            borderRadius: 10,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px -1px rgba(2, 132, 199, 0.4)",
          }}
        >
          <Plus size={16} />
          Record Rent Payment
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          background: "#ffffff",
          padding: 14,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search receipt, payment ref, M-Pesa code, tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#0f172a",
            }}
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 13,
            color: "#334155",
            background: "#ffffff",
          }}
        >
          <option value="">All Methods</option>
          <option value="Mpesa">M-Pesa</option>
          <option value="BankTransfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Receipt #</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Payment Ref</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tenant & Unit</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Method / Ref</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Amount</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Allocated</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const isConfirmed = p.paymentStatus === "Confirmed";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0284c7" }}>
                      {p.receiptNumber}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155", fontFamily: "monospace" }}>
                      {p.paymentReference}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      <div style={{ fontWeight: 600 }}>{p.tenantName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Unit {p.unitNumber} • {p.propertyName}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      <div style={{ fontWeight: 600 }}>{p.paymentMethod}</div>
                      {p.transactionReference && (
                        <div style={{ fontSize: 11, color: "#059669", fontFamily: "monospace" }}>
                          {p.transactionReference}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {new Date(p.paymentDate).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatKes(p.amount)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", color: "#059669", fontWeight: 600 }}>
                      {formatKes(p.amountAllocated)}
                      {p.unallocatedAmount > 0 && (
                        <div style={{ fontSize: 11, color: "#ea580c" }}>
                          +{formatKes(p.unallocatedAmount)} credit
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isConfirmed ? "#ecfdf5" : "#fef2f2",
                          color: isConfirmed ? "#059669" : "#dc2626",
                          border: isConfirmed ? "1px solid #a7f3d0" : "1px solid #fecaca",
                        }}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {isConfirmed && (
                        <button
                          onClick={() => {
                            setReversingPayment(p);
                            setReversalReason("");
                            setActionError("");
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "#fee2e2",
                            border: "1px solid #fecaca",
                            borderRadius: 6,
                            color: "#dc2626",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Loading payments..." : "No rent payments recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Record Rent Payment
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 20px" }}>
              Applies payment automatically to oldest outstanding rent charges. Overpayments become tenant credit.
            </p>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            {paymentSuccess ? (
              <div>
                <div
                  style={{
                    padding: 16,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#065f46", fontSize: 14, marginBottom: 8 }}>
                    Payment Recorded Successfully!
                  </div>
                  <div style={{ fontSize: 13, color: "#047857", lineHeight: 1.6 }}>
                    Receipt Number: <strong>{paymentSuccess.receiptNumber}</strong>
                    <br />
                    Payment Reference: <strong>{paymentSuccess.paymentReference}</strong>
                    <br />
                    Total Allocated: <strong>{formatKes(paymentSuccess.totalAllocated)}</strong>
                    {paymentSuccess.unallocatedCredit > 0 && (
                      <>
                        <br />
                        Overpayment Credit: <strong>{formatKes(paymentSuccess.unallocatedCredit)}</strong>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "var(--gradient-brand, #0284c7)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Active Lease / Unit *
                  </label>
                  <select
                    required
                    value={selectedTenancyId}
                    onChange={(e) => setSelectedTenancyId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#ffffff",
                    }}
                  >
                    <option value="">Select Tenancy...</option>
                    {activeTenancies.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.primaryTenant.fullName} — Unit {t.unitNumber} ({t.propertyName}) • Rent: {formatKes(t.monthlyRent)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Amount (KES) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      placeholder="e.g. 25000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        background: "#ffffff",
                      }}
                    >
                      <option value="Mpesa">M-Pesa</option>
                      <option value="BankTransfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Transaction Ref (M-Pesa / Bank)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. QKV3LHYU7P"
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Payer Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on payment receipt"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Payer Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0722000000"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "9px 16px",
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: 8,
                      color: "#475569",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "9px 18px",
                      background: "var(--gradient-brand, #0284c7)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {submitting ? "Processing..." : "Confirm & Allocate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {reversingPayment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 440,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#dc2626", margin: 0 }}>
              Reverse Payment {reversingPayment.receiptNumber}
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 16px" }}>
              Reversing this payment of <strong>{formatKes(reversingPayment.amount)}</strong> will undo all charge allocations and recalculate tenant balances as unpaid.
            </p>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            <form onSubmit={handleReverse}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Reversal Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Bounced cheque, wrong unit, M-Pesa dispute..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversing}
                  style={{
                    padding: "9px 18px",
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {reversing ? "Reversing..." : "Confirm Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
