"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsActivityTab } from "@/components/parent/payments/PaymentsActivityTab"
import { PaymentsFundingTab } from "@/components/parent/payments/PaymentsFundingTab"
import { BillingTab } from "@/components/parent/payments/BillingTab"
import { PaymentsOverviewTab } from "@/components/parent/payments/PaymentsOverviewTab"
import { DEMO_SCHOOL } from "@/data/demo"
import {
  PARENT_NAVY,
  PARENT_PAGE_PAD,
} from "@/components/parent/parent-dashboard-styles"

export type PaymentsTab = "overview" | "activity" | "funding" | "billing"

const VALID_TABS: PaymentsTab[] = ["overview", "activity", "funding", "billing"]

const TAB_LABELS: Record<PaymentsTab, string> = {
  overview: "Overview",
  activity: "Activity",
  funding: "Funding",
  billing: "Billing",
}

type PaymentsCenterProps = {
  defaultTab?: PaymentsTab
}

export function PaymentsCenter({ defaultTab = "overview" }: PaymentsCenterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get("tab")
  const resolvedParam =
    tabParam === "methods" ? "billing" : tabParam
  const activeTab: PaymentsTab =
    resolvedParam && VALID_TABS.includes(resolvedParam as PaymentsTab)
      ? (resolvedParam as PaymentsTab)
      : defaultTab

  const setTab = useCallback(
    (tab: PaymentsTab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", tab)
      router.replace(`/parent/payments?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} space-y-6`}>
      <header className="space-y-2">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: PARENT_NAVY }}
        >
          {DEMO_SCHOOL.name} · {DEMO_SCHOOL.location}
        </p>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Payments Center
        </h1>
        <p className="max-w-2xl text-sm text-[#64748B] md:text-base">
          Manage family balances, view activity, add funds, and billing preferences in one place.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as PaymentsTab)}>
        <TabsList className="h-auto flex-wrap rounded-[14px] border border-[#C8CDD7] bg-white p-1">
          {VALID_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="min-h-10 flex-none rounded-[10px] px-4 text-sm font-semibold data-[state=active]:border data-[state=active]:border-[#C8CDD7]"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <PaymentsOverviewTab onAddFunds={() => setTab("funding")} />
        </TabsContent>
        <TabsContent value="activity">
          <PaymentsActivityTab onAddFunds={() => setTab("funding")} />
        </TabsContent>
        <TabsContent value="funding">
          <PaymentsFundingTab />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab onMakeDeposit={() => setTab("funding")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** @deprecated Use PaymentsCenter */
export const ParentPaymentsCenter = PaymentsCenter
