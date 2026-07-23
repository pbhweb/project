"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"

type NotificationRow = {
  id: string
  title: string
  message: string
  type: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      setUserId(user.id)

      await loadNotifications(user.id)

      // 🔴 اشتراك Realtime: العداد يتحدث فوراً بدون أي polling عند وصول
      // إشعار جديد (عرض جديد، تسليم، دفع، عمولة...) بينما المستخدم بالصفحة.
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as NotificationRow, ...prev].slice(0, 10))
            setUnreadCount((prev) => prev + 1)
          },
        )
        .subscribe()
    }

    const loadNotifications = async (uid: string) => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(10)

      setNotifications(data || [])
      setUnreadCount((data || []).filter((n) => !n.is_read).length)
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)
  }

  const markAllAsRead = async () => {
    if (!userId) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
  }

  // 🆕 الضغط على أي إشعار يوديك مباشرة للمشروع اللي يخصّه (related_id يحمل
  // project_id بكل أنواع الإشعارات الحالية: عرض جديد، قبول عرض، تسليم، دفع، عمولة)
  const handleNotificationClick = async (n: NotificationRow) => {
    if (!n.is_read) {
      await markAsRead(n.id)
    }
    if (n.related_id) {
      router.push(`/projects/${n.related_id}`)
    }
  }

  if (!userId) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-neutral-300 hover:text-white hover:bg-white/5">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-sm font-semibold">الإشعارات</span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:underline">
              تحديد الكل كمقروء
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">لا توجد إشعارات</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-right px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  !n.is_read ? "bg-emerald-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{n.title}</p>
                    <p className="text-xs text-neutral-400 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
        <div className="px-3 py-2 border-t border-white/10">
          <Link href="/notifications" className="text-xs text-emerald-400 hover:underline">
            عرض كل الإشعارات
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
