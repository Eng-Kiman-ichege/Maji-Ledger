"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { UserSummaryDto, PropertySummaryDto, OwnerDto } from "@/types/domain";
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  X,
  Copy,
  Check,
  KeyRound,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function UsersClient() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [properties, setProperties] = useState<PropertySummaryDto[]>([]);
  const [owners, setOwners] = useState<OwnerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "Admin" | "Owner">("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [role, setRole] = useState<"Owner" | "Admin">("Owner");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Success Created Banner / Copy
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    fullName: string;
    role: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [uList, pList, oList] = await Promise.all([
        api.get<UserSummaryDto[]>("/api/v1/users"),
        api.get<PropertySummaryDto[]>("/api/v1/properties"),
        api.get<OwnerDto[]>("/api/v1/owners"),
      ]);
      setUsers(uList);
      setProperties(pList);
      setOwners(oList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await api.post(`/api/v1/users/${userId}/toggle-active`, {});
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle user status.");
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let newTemp = "";
    for (let i = 0; i < 12; i++) {
      newTemp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    try {
      await api.post(`/api/v1/users/${userId}/reset-password`, { newPassword: newTemp });
      alert(`Temporary password for ${email} generated:\n${newTemp}\nPlease share securely with the user.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reset password.");
    }
  };

  const handleOpenModal = () => {
    setFullName("");
    setEmail("");
    setPhoneNumber("+2547");
    setRole("Owner");
    setSelectedOwnerId("");
    setSelectedPropertyIds([]);
    generatePassword();
    setFormError("");
    setCreatedCredentials(null);
    setIsModalOpen(true);
  };

  const handleToggleProperty = (propId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !password.trim()) {
      setFormError("Email, full name, and password are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await api.post("/api/v1/users", {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        role: role,
        ownerId: role === "Owner" && selectedOwnerId ? selectedOwnerId : null,
        propertyIds: role === "Owner" ? selectedPropertyIds : [],
      });

      // Show credentials copy banner
      setCreatedCredentials({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: role,
        password: password.trim(),
      });

      // Refresh table
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Maji Ledger Login Credentials:\nURL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Filter Users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phoneNumber.toLowerCase().includes(q);
      const matchProp = u.assignedProperties.some((p) => p.propertyName.toLowerCase().includes(q));
      return matchName || matchEmail || matchPhone || matchProp;
    }
    return true;
  });

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* ── Top Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#f0f9ff",
                color: "#0284c7",
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid #bae6fd",
              }}
            >
              <ShieldCheck size={14} />
              SYSTEM ADMINISTRATION
            </span>
            <span style={{ fontSize: 13, color: "#64748b" }}>•</span>
            <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>Access Control & Provisioning</span>
          </div>

          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0f172a",
              margin: "6px 0",
            }}
          >
            User Management & Credentials
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Create logins for Property Owners and Administrators, assign scoped rental properties, and manage passwords.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={fetchData}
            className="btn-outline"
            style={{ fontSize: 13, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <UserPlus size={16} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#be123c",
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: 24,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by name, email, phone, or assigned property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base"
              style={{ paddingLeft: 38, width: "100%", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={15} color="#64748b" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "All" | "Admin" | "Owner")}
              className="input-base"
              style={{ width: "auto", fontSize: 13, padding: "8px 12px" }}
            >
              <option value="All">All Roles ({users.length})</option>
              <option value="Admin">Administrators</option>
              <option value="Owner">Property Owners</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b" }}>
          Showing <strong>{filteredUsers.length}</strong> of {users.length} users
        </div>
      </div>

      {/* ── Users Table ── */}
      <div
        className="glass-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>User</th>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>Role</th>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>Phone</th>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>
                  Assigned Properties (Scoped Access)
                </th>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: "left", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>
                  Created Date
                </th>
                <th style={{ textAlign: "right", padding: "14px 18px", color: "#475569", fontWeight: 700 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                    <div style={{ fontWeight: 600, color: "#334155" }}>No users match the criteria.</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      Create a user to provide access to property owners.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserAdmin = u.role === "Admin";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: isUserAdmin ? "#e0f2fe" : "#ecfdf5",
                              border: isUserAdmin ? "1px solid #bae6fd" : "1px solid #a7f3d0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: isUserAdmin ? "#0369a1" : "#047857",
                            }}
                          >
                            {u.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.fullName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isUserAdmin ? "#f0f9ff" : "#ecfdf5",
                            color: isUserAdmin ? "#0284c7" : "#059669",
                            border: isUserAdmin ? "1px solid #bae6fd" : "1px solid #a7f3d0",
                          }}
                        >
                          {isUserAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          {isUserAdmin ? "Administrator" : "Property Owner"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", color: "#334155", fontWeight: 500 }}>{u.phoneNumber}</td>

                      <td style={{ padding: "14px 18px" }}>
                        {isUserAdmin ? (
                          <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                            All Portfolio Properties (Unrestricted Admin)
                          </span>
                        ) : u.assignedProperties.length === 0 ? (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 500 }}>
                            ⚠️ No properties linked yet
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {u.assignedProperties.map((p) => (
                              <span
                                key={p.propertyId}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                🏢 {p.propertyName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: u.isActive ? "#059669" : "#94a3b8",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: u.isActive ? "#10b981" : "#cbd5e1",
                            }}
                          />
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            title={u.isActive ? "Deactivate user" : "Activate user"}
                            style={{
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: u.isActive ? "#fef2f2" : "#f0fdf4",
                              color: u.isActive ? "#b91c1c" : "#166534",
                              cursor: "pointer",
                            }}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleResetPassword(u.id, u.email)}
                            title="Reset password"
                            style={{
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: "1px solid #bae6fd",
                              background: "#f0f9ff",
                              color: "#0369a1",
                              cursor: "pointer",
                            }}
                          >
                            Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create User Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Create New Platform User
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                  Provision an account for a Property Owner or System Administrator.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* If Credentials Banner is showing after success */}
            {createdCredentials ? (
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 12,
                    padding: "20px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <CheckCircle2 size={22} color="#059669" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#065f46" }}>
                      User Account Created Successfully!
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#047857", marginBottom: 16 }}>
                    Share these login details with the user. They will only see information relevant to their role and
                    assigned properties.
                  </p>

                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 8,
                      padding: "14px 16px",
                      border: "1px solid #bbf7d0",
                      fontSize: 13,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Name: </span>
                      <strong style={{ color: "#0f172a" }}>{createdCredentials.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Login Email: </span>
                      <strong style={{ color: "#0284c7" }}>{createdCredentials.email}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Password: </span>
                      <code
                        style={{
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 700,
                          color: "#0f172a",
                          fontSize: 13,
                        }}
                      >
                        {createdCredentials.password}
                      </code>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Assigned Role: </span>
                      <span
                        style={{
                          background: createdCredentials.role === "Admin" ? "#f0f9ff" : "#ecfdf5",
                          color: createdCredentials.role === "Admin" ? "#0284c7" : "#059669",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {createdCredentials.role}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                    <button
                      onClick={handleCopyCredentials}
                      className="btn-primary"
                      style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? "Copied to Clipboard!" : "Copy Login Credentials"}</span>
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="btn-outline"
                      style={{ fontSize: 13, padding: "8px 16px" }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
                {formError && (
                  <div
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 16,
                      color: "#be123c",
                      fontSize: 13,
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Role Switcher */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    User Role
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setRole("Owner")}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: role === "Owner" ? "2px solid #059669" : "1px solid #e2e8f0",
                        background: role === "Owner" ? "#ecfdf5" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <UserCheck size={18} color={role === "Owner" ? "#059669" : "#64748b"} />
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: role === "Owner" ? "#065f46" : "#334155",
                          }}
                        >
                          Property Owner
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Only sees water used & collections</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("Admin")}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: role === "Admin" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                        background: role === "Admin" ? "#f0f9ff" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <ShieldCheck size={18} color={role === "Admin" ? "#0284c7" : "#64748b"} />
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: role === "Admin" ? "#0369a1" : "#334155",
                          }}
                        >
                          Administrator
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Full management, STS & QR analytics</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Kamau"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-base"
                    style={{ width: "100%", fontSize: 13 }}
                  />
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Email Address (Login Username)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={15}
                      color="#94a3b8"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="owner@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-base"
                      style={{ paddingLeft: 36, width: "100%", fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Phone Number (Disbursement M-Pesa)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone
                      size={15}
                      color="#94a3b8"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="tel"
                      required
                      placeholder="+254712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input-base"
                      style={{ paddingLeft: 36, width: "100%", fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Password Setting with Generator */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Assign Password</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0284c7",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <KeyRound size={13} />
                      <span>Generate Password</span>
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", fontSize: 13, paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    The user will use their email and this password to sign into their portal.
                  </div>
                </div>

                {/* Property Assignment (Only when Role is Owner) */}
                {role === "Owner" && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Map Properties (Strict Landlord Scope)
                    </label>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>
                      Select the properties this owner manages. They will strictly only see water used and collections
                      for these properties.
                    </p>

                    {/* Optional link to existing Owner entity */}
                    {owners.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: "#475569", fontWeight: 600, display: "block", marginBottom: 4 }}>
                          Link to Registered Owner Record (Optional):
                        </label>
                        <select
                          value={selectedOwnerId}
                          onChange={(e) => setSelectedOwnerId(e.target.value)}
                          className="input-base"
                          style={{ width: "100%", fontSize: 13 }}
                        >
                          <option value="">-- Create or Auto-Map to New Owner Record --</option>
                          {owners.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.fullName} ({o.phone})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div
                      style={{
                        maxHeight: 160,
                        overflowY: "auto",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 8,
                        background: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {properties.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#94a3b8", padding: 8 }}>
                          No properties registered in portfolio yet.
                        </div>
                      ) : (
                        properties.map((p) => {
                          const isSelected = selectedPropertyIds.includes(p.propertyId);
                          return (
                            <label
                              key={p.propertyId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: isSelected ? "#e0f2fe" : "#ffffff",
                                border: isSelected ? "1px solid #bae6fd" : "1px solid #e2e8f0",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleProperty(p.propertyId)}
                              />
                              <div style={{ flex: 1 }}>
                                <strong style={{ color: "#0f172a" }}>{p.propertyName}</strong>
                                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                                  ({p.town || "Nairobi"} • {p.county || "Kenya"})
                                </span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-outline"
                    style={{ fontSize: 13, padding: "9px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ fontSize: 13, padding: "9px 20px" }}
                  >
                    {submitting ? "Creating User..." : "Create Account & Grant Access"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
