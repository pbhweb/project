"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function TransactionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSpent: 0,
    pendingAmount: 0,
    completedTransactions: 0,
  })

  useEffect(() => {
    loadTransactionsData()
  }, [])

  const loadTransactionsData = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setUserProfile(profile)

      // Get all transactions related to user
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select(
          `
          *,
          projects (title, owner_id),
          bids (freelancer_id),
          affiliates (user_id)
        `,
        )
        .order("created_at", { ascending: false })

      // Filter transactions relevant to current user
      const filteredTransactions =
        transactionsData?.filter((tx) => {
          const project = tx.projects as any
          const bid = tx.bids as any
          const affiliate = tx.affiliates as any

          return project?.owner_id === user.id || bid?.freelancer_id === user.id || affiliate?.user_id === user.id
        }) || []

      setTransactions(filteredTransactions)

      // Calculate stats
      let totalEarnings = 0
      let totalSpent = 0
      let pendingAmount = 0
      let completedTransactions = 0

      filteredTransactions.forEach((tx) => {
        const project = tx.projects as any
        const bid = tx.bids as any
        const affiliate = tx.affiliates as any

        if (tx.status === "completed") {
          completedTransactions++

          // User earned money (as freelancer or affiliate)
          if (bid?.freelancer_id === user.id || affiliate?.user_id === user.id) {
            totalEarnings += Number.parseFloat(tx.amount)
          }

          // User spent money (as business owner)
          if (project?.owner_id === user.id) {
            totalSpent += Number.parseFloat(tx.amount)
          }
        } else if (tx.status === "pending") {
          if (bid?.freelancer_id === user.id || affiliate?.user_id === user.id) {
            pendingAmount += Number.parseFloat(tx.amount)
          }
        }
      })

      setStats({
        totalEarnings,
        totalSpent,
        pendingAmount,
        completedTransactions,
      })
    } catch (err: any) {
      console.error("[v0] Error loading transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  const earningsTransactions = transactions.filter((tx) => {
    const bid = tx.bids as any
    const affiliate = tx.affiliates as any
    return bid?.freelancer_id === userProfile?.id || affiliate?.user_id === userProfile?.id
  })

  const spentTransactions = transactions.filter((tx) => {
    const project = tx.projects as any
    return project?.owner_id === userProfile?.id
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-xl">$</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">المعاملات المالية</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">لوحة التحكم</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>إجمالي الأرباح</CardDescription>
                <CardTitle className="text-3xl text-green-600">${stats.totalEarnings.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>إجمالي المصروفات</CardDescription>
                <CardTitle className="text-3xl text-red-600">${stats.totalSpent.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>المبالغ المعلقة</CardDescription>
                <CardTitle className="text-3xl text-orange-600">${stats.pendingAmount.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>المعاملات المكتملة</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.completedTransactions}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
              <CardDescription>جميع المعاملات المالية الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">الكل ({transactions.length})</TabsTrigger>
                  <TabsTrigger value="earnings">الأرباح ({earningsTransactions.length})</TabsTrigger>
                  <TabsTrigger value="spent">المصروفات ({spentTransactions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">لا توجد معاملات حتى الآن</div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => {
                        const project = tx.projects as any
                        const bid = tx.bids as any
                        const affiliate = tx.affiliates as any
                        const isEarning =
                          bid?.freelancer_id === userProfile?.id || affiliate?.user_id === userProfile?.id

                        return (
                          <div key={tx.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      tx.status === "completed"
                                        ? "default"
                                        : tx.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {tx.status === "completed"
                                      ? "مكتمل"
                                      : tx.status === "pending"
                                        ? "قيد الانتظار"
                                        : "فشل"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {tx.transaction_type === "project_payment" ? "دفعة مشروع" : "عمولة أفلييت"}
                                  </Badge>
                                </div>
                                <p className="font-semibold mb-1">{project?.title || "معاملة مالية"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className={`text-2xl font-bold ${isEarning ? "text-green-600" : "text-red-600"}`}>
                                  {isEarning ? "+" : "-"}${Number.parseFloat(tx.amount).toFixed(2)}
                                </p>
                                {tx.commission_amount > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    عمولة: ${Number.parseFloat(tx.commission_amount).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4">
                  {earningsTransactions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">لا توجد أرباح حتى الآن</div>
                  ) : (
                    <div className="space-y-3">
                      {earningsTransactions.map((tx) => {
                        const project = tx.projects as any

                        return (
                          <div key={tx.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      tx.status === "completed"
                                        ? "default"
                                        : tx.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {tx.status === "completed"
                                      ? "مكتمل"
                                      : tx.status === "pending"
                                        ? "قيد الانتظار"
                                        : "فشل"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {tx.transaction_type === "project_payment" ? "دفعة مشروع" : "عمولة أفلييت"}
                                  </Badge>
                                </div>
                                <p className="font-semibold mb-1">{project?.title || "معاملة مالية"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-2xl font-bold text-green-600">
                                  +${Number.parseFloat(tx.amount).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="spent" className="space-y-4">
                  {spentTransactions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">لا توجد مصروفات حتى الآن</div>
                  ) : (
                    <div className="space-y-3">
                      {spentTransactions.map((tx) => {
                        const project = tx.projects as any

                        return (
                          <div key={tx.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      tx.status === "completed"
                                        ? "default"
                                        : tx.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {tx.status === "completed"
                                      ? "مكتمل"
                                      : tx.status === "pending"
                                        ? "قيد الانتظار"
                                        : "فشل"}
                                  </Badge>
                                </div>
                                <p className="font-semibold mb-1">{project?.title || "معاملة مالية"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-2xl font-bold text-red-600">
                                  -${Number.parseFloat(tx.amount).toFixed(2)}
                                </p>
                                {tx.commission_amount > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    عمولة أفلييت: ${Number.parseFloat(tx.commission_amount).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
