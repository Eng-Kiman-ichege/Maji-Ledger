"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AppNotificationDto } from "@/types/domain";
import { Bell, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

export default function LandlordNotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<AppNotificationDto[]>(
        `/api/v1/notifications?unreadOnly=${unreadOnly}`
      );
      setNotifications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/api/v1/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/v1/notifications/all/read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Notification Inbox</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Real-time notifications regarding rent payments, water tokens, and maintenance requests.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: unreadOnly ? "#f0f9ff" : "#ffffff",
              color: unreadOnly ? "#0284c7" : "#475569",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {unreadOnly ? "Showing Unread" : "Show All"}
          </button>

          <button
            onClick={handleMarkAllRead}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0284c7",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <CheckCheck size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Bell size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Notifications</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>You are completely caught up on all alerts.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: n.isRead ? "#ffffff" : "#f0f9ff",
                border: n.isRead ? "1px solid #e2e8f0" : "1px solid #bae6fd",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: n.isRead ? "#f1f5f9" : "#e0f2fe",
                    color: n.isRead ? "#64748b" : "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as read"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0284c7",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
