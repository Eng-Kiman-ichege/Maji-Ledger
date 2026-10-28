"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { PropertyDto, BuildingDto, PropertyType } from "@/types/domain";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";

const TYPE_BADGE: Record<PropertyType, { color: string; bg: string; border: string }> = {
  Residential: { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  Commercial: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  Mixed: { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
};

function PropertyCard({
  property,
  expanded,
  onToggle,
  onBuildingAdded,
}: {
  property: PropertyDto;
  expanded: boolean;
  onToggle: () => void;
  onBuildingAdded: () => void;
}) {
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newFloorCount, setNewFloorCount] = useState("4");
  const [creatingBuilding, setCreatingBuilding] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  useEffect(() => {
    if (!expanded) return;
    setLoadingBuildings(true);
    api
      .get<BuildingDto[]>(`/api/v1/properties/${property.id}/buildings`)
      .then(setBuildings)
      .catch(() => setBuildings([]))
      .finally(() => setLoadingBuildings(false));
  }, [expanded, property.id]);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) return;

    setCreatingBuilding(true);
    setBuildingError("");
    try {
      await api.post(`/api/v1/properties/${property.id}/buildings`, {
        propertyId: property.id,
        name: newBuildingName.trim(),
        floorCount: parseInt(newFloorCount, 10) || undefined,
      });

      // Reload buildings
      const updated = await api.get<BuildingDto[]>(`/api/v1/properties/${property.id}/buildings`);
      setBuildings(updated);
      setIsAddingBuilding(false);
      setNewBuildingName("");
      onBuildingAdded();
    } catch (err: unknown) {
      setBuildingError(err instanceof Error ? err.message : "Failed to add building.");
    } finally {
      setCreatingBuilding(false);
    }
  };

  const badge = TYPE_BADGE[property.type] ?? TYPE_BADGE.Residential;

  return (
    <div
      className="glass-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        borderColor: expanded ? "#bae6fd" : "#e2e8f0",
        boxShadow: expanded ? "var(--shadow-card-hover)" : "var(--shadow-card)",
      }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "20px 24px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#f0f9ff",
            color: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            border: "1px solid #bae6fd",
          }}
        >
          <Building2 size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {property.name}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 9999,
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
              }}
            >
              {property.type}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 9999,
                background: property.isActive ? "#ecfdf5" : "#f1f5f9",
                color: property.isActive ? "#059669" : "#64748b",
                border: `1px solid ${property.isActive ? "#a7f3d0" : "#cbd5e1"}`,
              }}
            >
              {property.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={13} color="#94a3b8" />
            <span>{[property.town, property.county].filter(Boolean).join(", ") || "Kenya"}</span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              {property.buildingCount} registered building{property.buildingCount !== 1 ? "s" : ""}
            </span>
            {property.address && <span>• {property.address}</span>}
          </div>
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded buildings list & management */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            background: "#f8fafc",
            padding: "20px 24px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
              Registered Buildings & Blocks
            </div>

            <button
              onClick={() => setIsAddingBuilding(!isAddingBuilding)}
              className="btn-outline"
              style={{ fontSize: 12, padding: "5px 12px" }}
            >
              <Plus size={14} />
              <span>{isAddingBuilding ? "Cancel" : "Add Building"}</span>
            </button>
          </div>

          {/* Inline Add Building Form */}
          {isAddingBuilding && (
            <form
              onSubmit={handleCreateBuilding}
              style={{
                background: "#ffffff",
                padding: "16px",
                borderRadius: 12,
                border: "1px solid #bae6fd",
                marginBottom: 16,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                Add New Building to {property.name}
              </div>

              {buildingError && (
                <div style={{ color: "#be123c", fontSize: 12, marginBottom: 10 }}>{buildingError}</div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10 }}>
                <input
                  type="text"
                  required
                  placeholder="Building / Block name (e.g. Block A)"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="input-base"
                />
                <input
                  type="number"
                  placeholder="Floor count"
                  value={newFloorCount}
                  onChange={(e) => setNewFloorCount(e.target.value)}
                  className="input-base"
                />
                <button type="submit" className="btn-primary" disabled={creatingBuilding}>
                  {creatingBuilding ? "Saving..." : "Save Building"}
                </button>
              </div>
            </form>
          )}

          {loadingBuildings ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Loading buildings...</div>
          ) : buildings.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: "#ffffff",
                borderRadius: 10,
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              No buildings registered yet for this property. Click &quot;Add Building&quot; to begin.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {buildings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "#0f172a",
                    }}
                  >
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {b.apartmentCount} rental unit{b.apartmentCount !== 1 ? "s" : ""}
                    {b.floorCount ? ` • ${b.floorCount} floors` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertiesClient() {
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Add Property Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("Residential");
  const [newTown, setNewTown] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadProperties = () => {
    setLoading(true);
    api
      .get<PropertyDto[]>("/api/v1/properties")
      .then((data) => setProperties(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load properties."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyName.trim()) return;

    setIsCreating(true);
    setCreateError("");
    try {
      await api.post("/api/v1/properties", {
        name: newPropertyName.trim(),
        type: newPropertyType,
        town: newTown.trim() || undefined,
        county: newCounty.trim() || undefined,
        address: newAddress.trim() || undefined,
      });

      setIsAddOpen(false);
      setNewPropertyName("");
      setNewTown("");
      setNewCounty("");
      setNewAddress("");
      loadProperties();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create property.");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.town ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.county ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            Properties & Real Estate Portfolio
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Manage registered estates, residential buildings, and rental water billing meters.
          </p>
        </div>

        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ padding: "9px 18px" }}>
          <Plus size={16} />
          <span>Add New Property</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260, maxWidth: 440 }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search properties by name, town, or county..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-base"
          style={{ width: "auto" }}
        >
          <option value="all">All Property Types</option>
          <option value="Residential">Residential Only</option>
          <option value="Commercial">Commercial Only</option>
          <option value="Mixed">Mixed Use</option>
        </select>
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} found
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* Property cards list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card"
              style={{ height: 84, opacity: 0.5, background: "#ffffff" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏘️</div>
          <p style={{ color: "#334155", fontWeight: 700, fontSize: 15, margin: 0 }}>
            {search ? `No properties match "${search}".` : "No properties registered yet."}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            Click &quot;Add New Property&quot; to register your first estate or apartment complex.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              expanded={expandedId === prop.id}
              onToggle={() => setExpandedId(expandedId === prop.id ? null : prop.id)}
              onBuildingAdded={loadProperties}
            />
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {isAddOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="glass-card"
            style={{ width: "100%", maxWidth: 520, padding: "32px", boxShadow: "var(--shadow-dropdown)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={20} color="#0284c7" />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Register New Property
                </h2>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty}>
              {createError && (
                <div style={{ background: "#fff1f2", color: "#be123c", padding: "10px", borderRadius: 8, marginBottom: 14 }}>
                  {createError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenwood Gardens"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    className="input-base"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Property Type
                  </label>
                  <select
                    value={newPropertyType}
                    onChange={(e) => setNewPropertyType(e.target.value as PropertyType)}
                    className="input-base"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Town
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mombasa"
                      value={newTown}
                      onChange={(e) => setNewTown(e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      County
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mombasa County"
                      value={newCounty}
                      onChange={(e) => setNewCounty(e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Physical Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Links Road, Nyali"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24,
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 16,
                }}
              >
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary" disabled={isCreating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? "Saving..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
