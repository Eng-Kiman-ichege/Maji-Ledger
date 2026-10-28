"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { PropertyDto, BuildingDto } from "@/types/domain";

const TYPE_ICON: Record<string, string> = {
  Residential: "🏘️",
  Commercial: "🏢",
  Mixed: "🏬",
};

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          marginBottom: 6,
        }}
      >
        Properties
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
        All registered estates, buildings, and apartments.
      </p>
    </div>
  );
}

function PropertyCard({
  property,
  expanded,
  onToggle,
}: {
  property: PropertyDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  useEffect(() => {
    if (!expanded || buildings.length > 0) return;
    setLoadingBuildings(true);
    api
      .get<BuildingDto[]>(`/api/v1/properties/${property.id}/buildings`)
      .then(setBuildings)
      .catch(() => setBuildings([]))
      .finally(() => setLoadingBuildings(false));
  }, [expanded, property.id, buildings.length]);

  return (
    <div
      className="glass-card"
      style={{
        overflow: "hidden",
        transition: "border-color 0.2s",
        borderColor: expanded ? "rgba(14,165,233,0.25)" : undefined,
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
          padding: "20px 22px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(14,165,233,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {TYPE_ICON[property.type] ?? "🏘️"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {property.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 100,
                background: property.isActive
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(148,163,184,0.08)",
                color: property.isActive ? "#4ade80" : "var(--color-text-dim)",
                border: `1px solid ${
                  property.isActive ? "rgba(74,222,128,0.2)" : "rgba(148,163,184,0.12)"
                }`,
              }}
            >
              {property.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {property.type} ·{" "}
            {[property.town, property.county].filter(Boolean).join(", ") || "Kenya"} ·{" "}
            {property.buildingCount} building{property.buildingCount !== 1 ? "s" : ""}
            {property.address && ` · ${property.address}`}
          </div>
        </div>

        <span
          style={{
            fontSize: 18,
            color: "var(--color-text-muted)",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ˅
        </span>
      </button>

      {/* Expanded buildings list */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(148,163,184,0.08)",
            padding: "16px 22px 20px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-text-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Buildings
          </div>

          {loadingBuildings ? (
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Loading buildings...
            </div>
          ) : buildings.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-dim)" }}>
              No buildings registered for this property.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {buildings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(148,163,184,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {b.apartmentCount} unit{b.apartmentCount !== 1 ? "s" : ""}
                    {b.floorCount ? ` · ${b.floorCount} floors` : ""}
                    {b.description ? ` · ${b.description}` : ""}
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

  useEffect(() => {
    let mounted = true;
    api
      .get<PropertyDto[]>("/api/v1/properties")
      .then((data) => mounted && setProperties(data))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.town ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.county ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      <PageHeader />

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search properties by name, town, or county..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(30,41,59,0.7)",
            border: "1px solid rgba(148,163,184,0.15)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
          {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} found
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* Property cards */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card"
              style={{ height: 84, opacity: 0.4 }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏘️</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
            {search ? `No properties match "${search}".` : "No properties registered yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              expanded={expandedId === prop.id}
              onToggle={() =>
                setExpandedId(expandedId === prop.id ? null : prop.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
