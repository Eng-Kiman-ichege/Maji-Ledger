"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { SystemSettingDto, SettingCategory } from "@/types/domain";
import { Sliders, Edit2, Save, X, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === "All" ? "/api/v1/admin/settings" : `/api/v1/admin/settings?category=${selectedCategory}`;
      const res = await api.get<SystemSettingDto[]>(url);
      setSettings(res || []);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to load settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: SystemSettingDto) => {
    setEditingKey(s.key);
    setEditValue(s.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setMsg(null);
      await api.put(`/api/v1/admin/settings/${encodeURIComponent(key)}`, {
        value: editValue,
      });
      setMsg({ text: `Setting '${key}' updated successfully.`, type: "success" });
      setEditingKey(null);
      fetchSettings();
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to update setting.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const categories = ["All", "General", "PaymentGateway", "SmsGateway", "Billing", "Security"];

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
          Platform Configuration
        </span>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
          System Settings & Parameters
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Manage global thresholds, automated billing grace periods, and payment gateway configuration.
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

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: selectedCategory === c ? "1px solid #0284c7" : "1px solid #e2e8f0",
              background: selectedCategory === c ? "#0284c7" : "#ffffff",
              color: selectedCategory === c ? "#ffffff" : "#475569",
              fontSize: 13,
              fontWeight: selectedCategory === c ? 600 : 500,
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Settings Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading system settings...</div>
        ) : settings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No configuration settings found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 18px" }}>Setting Key</th>
                <th style={{ padding: "12px 18px" }}>Category</th>
                <th style={{ padding: "12px 18px" }}>Value</th>
                <th style={{ padding: "12px 18px" }}>Description</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0f172a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {s.isEncrypted && <Lock size={13} color="#f59e0b" />}
                      <code>{s.key}</code>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#64748b" }}>
                    <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                      {s.category}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {editingKey === s.key ? (
                      <input
                        type={s.isEncrypted ? "password" : "text"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #0284c7", fontSize: 13, width: "100%", maxWidth: 260 }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                        {s.isEncrypted ? "••••••••••••" : s.value}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#64748b", maxWidth: 300 }}>
                    {s.description}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    {editingKey === s.key ? (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleSave(s.key)}
                          disabled={saving}
                          style={{ background: "#059669", color: "#ffffff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Save size={13} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#0284c7", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
