"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { TenantProfileDto } from "@/types/domain";
import { User, Phone, Mail, MapPin, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<TenantProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get<TenantProfileDto>("/api/v1/tenant-portal/profile");
      setProfile(res);
      setPhone(res.phoneNumber || "");
      setAltPhone(res.alternativePhoneNumber || "");
      setEmail(res.email || "");
      setAddress(res.address || "");
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to load profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setSaving(true);
      setMsg(null);
      await api.put("/api/v1/tenant-portal/profile", {
        phoneNumber: phone.trim(),
        alternativePhoneNumber: altPhone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setMsg({ text: "Resident profile updated successfully.", type: "success" });
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading profile details...</div>;
  }

  if (!profile) return null;

  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Resident Profile & Contact Preferences
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Ensure your contact numbers and email are up to date for SMS token delivery and billing alerts.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: msg.type === "success" ? "#166534" : "#991b1b",
            border: msg.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
          }}
        >
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Full Name & National ID (read only) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
              Full Name (Registered)
            </label>
            <input
              type="text"
              disabled
              value={`${profile.firstName} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName}`}
              style={{ width: "100%", padding: "9px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#64748b" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
              National ID / Passport
            </label>
            <input
              type="text"
              disabled
              value={profile.nationalId || "Not Registered"}
              style={{ width: "100%", padding: "9px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#64748b" }}
            />
          </div>
        </div>

        {/* Primary Phone Number */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
            Primary Mobile Number (Used for SMS & M-Pesa)
          </label>
          <div style={{ position: "relative" }}>
            <Phone size={16} color="#64748b" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 254712345678"
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Alternative Phone */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
            Alternative Mobile Number
          </label>
          <div style={{ position: "relative" }}>
            <Phone size={16} color="#64748b" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="tel"
              value={altPhone}
              onChange={(e) => setAltPhone(e.target.value)}
              placeholder="Optional secondary phone number"
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
            Email Address (Receipts & Notices)
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={16} color="#64748b" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="resident@example.com"
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Postal Address */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
            Postal / Physical Address
          </label>
          <div style={{ position: "relative" }}>
            <MapPin size={16} color="#64748b" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="P.O. Box or physical address"
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Save size={16} />
            {saving ? "Saving Changes..." : "Save Contact Info"}
          </button>
        </div>
      </form>
    </div>
  );
}
