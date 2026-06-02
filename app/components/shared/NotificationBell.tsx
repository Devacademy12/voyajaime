"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function NotificationBell({
  userId,
  compact = false,
}: {
  userId?: string | null;
  compact?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!userId) return;

    const [{ data: notifications }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, message, type, is_read, created_at, metadata")
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", userId)
        .eq("is_read", false),
    ]);

    setItems((notifications || []) as NotificationItem[]);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markRead = async (notificationId: string) => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);
  };

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_user_id", userId)
      .eq("is_read", false);
    await loadNotifications();
  };

  const openNotification = async (item: NotificationItem) => {
    await markRead(item.id);
    const link = item.metadata?.dashboard_link || item.metadata?.conversation_link;
    if (typeof link === "string" && link) {
      router.push(link);
    }
    setOpen(false);
  };

  if (!userId) {
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: compact ? 38 : 42,
          height: compact ? 38 : 42,
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          background: open ? "#F8FAFC" : "white",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          boxShadow: "0 2px 8px rgba(5,51,102,.05)",
        }}
        aria-label="Notifications"
      >
        <Bell size={18} color="#2B96A8" />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -3,
            right: -3,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            padding: "0 4px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#DC2626",
            color: "white",
            fontSize: 10,
            fontWeight: 800,
            border: "2px solid white",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "transparent", border: 0, padding: 0, zIndex: 59 }}
            aria-label="Fermer les notifications"
          />
          <div style={{
            position: "absolute",
            top: 50,
            right: 0,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 18,
            boxShadow: "0 18px 48px rgba(5,51,102,.16)",
            zIndex: 60,
            overflow: "hidden",
          }}>
            <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#053366" }}>Notifications</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>{unreadCount} non lue(s)</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{
                    border: 0,
                    background: "#EFF6FF",
                    color: "#2563EB",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CheckCheck size={14} /> Tout lire
                </button>
              )}
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                  Aucune notification pour le moment.
                </div>
              ) : items.map((item) => {
                const link = item.metadata?.dashboard_link || item.metadata?.conversation_link;
                const isInteractive = typeof link === "string" && link.length > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    style={{
                      width: "100%",
                      display: "block",
                      textAlign: "left",
                      border: 0,
                      background: item.is_read ? "white" : "#F8FAFC",
                      borderBottom: "1px solid #F3F4F6",
                      padding: 14,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: item.is_read ? "#F3F4F6" : "rgba(43,150,168,.10)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Bell size={15} color={item.is_read ? "#9CA3AF" : "#2B96A8"} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{item.title}</p>
                          <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{formatTime(item.created_at)}</span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, color: "#64748B" }}>{item.message}</p>
                        {isInteractive && (
                          <span style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#2B96A8" }}>
                            Ouvrir <ExternalLink size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
