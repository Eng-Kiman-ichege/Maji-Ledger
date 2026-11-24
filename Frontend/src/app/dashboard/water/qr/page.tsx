"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterMeterDto, PropertyDto } from "@/types/domain";
import {
  QrCode,
  RefreshCw,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ExternalLink,
  ShieldAlert,
  Building2,
  X,
} from "lucide-react";

export default function WaterQrPage() {
  const [meters, setMeters] = useState<WaterMeterDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Sticker preview modal
  const [stickerMeter, setStickerMeter] = useState<WaterMeterDto | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadMeters();
    loadProperties();
  }, [propertyFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMeters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.append("propertyId", propertyFilter);
      const res = await api.get<WaterMeterDto[]>(`/api/v1/water/meters?${params.toString()}`);
      setMeters(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQr = async (meter: WaterMeterDto) => {
    setProcessingId(meter.id);
    setActionError("");
    try {
      const res = await api.post<{ publicToken: string; scanUrl: string }>(
        `/api/v1/water/meters/${meter.id}/qr/generate`,
        {}
      );
      await loadMeters();
      // Auto open sticker if none was open
      setStickerMeter({ ...meter, activeQrCodeToken: res.publicToken });
    } catch (err: any) {
      setActionError(err?.message || "Failed to generate QR code");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeQr = async (meterId: string) => {
    if (!confirm("Are you sure you want to revoke this meter's QR code? Existing physical stickers will stop working.")) {
      return;
    }
    setProcessingId(meterId);
    setActionError("");
    try {
      await api.post(`/api/v1/water/meters/${meterId}/qr/revoke`, {});
      if (stickerMeter?.id === meterId) {
        setStickerMeter(null);
      }
      await loadMeters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to revoke QR code");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyUrl = (publicToken: string) => {
    const url = `${window.location.origin}/pay/${publicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(publicToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filtered = meters.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.meterNumber.toLowerCase().includes(q) ||
      (m.propertyName && m.propertyName.toLowerCase().includes(q)) ||
      (m.unitNumber && m.unitNumber.toLowerCase().includes(q)) ||
      (m.activeQrCodeToken && m.activeQrCodeToken.toLowerCase().includes(q))
    );
  });

  const activeQrCount = meters.filter((m) => m.activeQrCodeToken).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0284c7",
                background: "#f0f9ff",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #bae6fd",
                textTransform: "uppercase",
              }}
            >
              Water Ledger
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Water QR Codes & Scan-to-Pay Portal
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Generate, print stickers, and manage secure tenant scan-to-pay portals for meters
          </p>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#dc2626",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {actionError}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Active QR Stickers</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
            {activeQrCount} / {meters.length}
          </div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Assigned to Units</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {meters.filter((m) => m.currentApartmentId).length}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search by meter #, property, unit, or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName || p.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadMeters}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading QR records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <QrCode size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No meters found</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property & Unit</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>QR Public Token</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Portal URL</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{m.meterNumber}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{m.type} · {m.integrationType}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {m.propertyName ? (
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.propertyName}</div>
                          <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600 }}>
                            Unit {m.unitNumber}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {m.activeQrCodeToken ? (
                        <code
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#059669",
                            background: "#ecfdf5",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          {m.activeQrCodeToken}
                        </code>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>No active QR</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {m.activeQrCodeToken ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                            /pay/{m.activeQrCodeToken.slice(0, 10)}...
                          </span>
                          <button
                            onClick={() => handleCopyUrl(m.activeQrCodeToken!)}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              color: copiedToken === m.activeQrCodeToken ? "#059669" : "#94a3b8",
                            }}
                            title="Copy full payment URL"
                          >
                            {copiedToken === m.activeQrCodeToken ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                          <a
                            href={`/pay/${m.activeQrCodeToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#0284c7" }}
                            title="Open scan-to-pay landing page"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        {m.activeQrCodeToken ? (
                          <>
                            <button
                              onClick={() => setStickerMeter(m)}
                              style={{
                                padding: "6px 10px",
                                background: "#f0f9ff",
                                border: "1px solid #bae6fd",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#0284c7",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Printer size={13} /> View / Print Sticker
                            </button>
                            <button
                              onClick={() => handleRevokeQr(m.id)}
                              disabled={processingId === m.id}
                              style={{
                                padding: "6px 10px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                            >
                              Revoke
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerateQr(m)}
                            disabled={processingId === m.id}
                            style={{
                              padding: "6px 12px",
                              background: "#0284c7",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <QrCode size={13} /> Generate QR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View / Print Sticker */}
      {stickerMeter && stickerMeter.activeQrCodeToken && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 440,
              width: "100%",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Physical Meter QR Sticker
              </h2>
              <button
                onClick={() => setStickerMeter(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Sticker Box */}
            <div
              id="printable-sticker"
              style={{
                border: "3px solid #0284c7",
                borderRadius: 12,
                padding: "20px 16px",
                background: "#f0f9ff",
                margin: "0 auto 20px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#0284c7", letterSpacing: "0.05em" }}>
                MAJI LEDGER · PREPAID WATER
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stickerMeter.propertyName || "Property Name"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0284c7", marginBottom: 12 }}>
                {stickerMeter.unitNumber ? `APARTMENT / UNIT ${stickerMeter.unitNumber}` : "WATER METER"}
              </div>

              {/* QR Box Graphic Mock / SVG */}
              <div
                style={{
                  background: "#fff",
                  padding: 16,
                  borderRadius: 12,
                  display: "inline-block",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid #bae6fd",
                  margin: "8px 0",
                }}
              >
                <QrCode size={140} style={{ color: "#0f172a" }} />
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  METER: <span style={{ fontFamily: "monospace", color: "#0f172a" }}>{stickerMeter.meterNumber}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Scan with your phone camera to purchase water tokens instantly via M-Pesa
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "10px 18px",
                  background: "#0284c7",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Printer size={16} /> Print Sticker
              </button>
              <button
                onClick={() => handleCopyUrl(stickerMeter.activeQrCodeToken!)}
                style={{
                  padding: "10px 18px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Copy size={16} /> Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
