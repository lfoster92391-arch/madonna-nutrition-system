"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsActivityTab } from "@/components/parent/payments/PaymentsActivityTab"
import { PaymentsFundingTab } from "@/components/parent/payments/PaymentsFundingTab"
import { PaymentsMethodsTab } from "@/components/parent/payments/PaymentsMethodsTab"
import { PaymentsOverviewTab } from "@/components/parent/payments/PaymentsOverviewTab"
import { SCHOOL } from "@/config/school"
import {
  PARENT_NAVY,
  PARENT_PAGE_PAD,
  PARENT_SECTION_GAP,
} from "@/components/parent/parent-dashboard-styles"

export type PaymentsTab = "overview" | "activity" | "funding" | "methods"

const VALID_TABS: PaymentsTab[] = ["overview", "activity", "funding", "methods"]

const TAB_LABELS: Record<PaymentsTab, string> = {
  overview: "Overview",
  activity: "Activity",
  funding: "Funding",
  methods: "Methods",
}

type PaymentsCenterProps = {
  defaultTab?: PaymentsTab
}

export function PaymentsCenter({ defaultTab = "overview" }: PaymentsCenterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get("tab")
  const resolvedParam =
    tabParam === "billing" || tabParam === "methods"
      ? "methods"
      : tabParam === "purchases" || tabParam === "deposits"
        ? "activity"
        : tabParam
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
    <div className={`w-full max-w-none ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: PARENT_NAVY }}>
          {SCHOOL.name} · {SCHOOL.location}
        </p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Payments Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[#64748B] md:text-base">
          Manage family balances, view activity, add funds, and payment methods in one place.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as PaymentsTab)}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-[14px] border-[#C8CDD7] bg-[#041B52]/5 p-1">
          {VALID_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="min-h-10 flex-none rounded-[10px] px-4 text-sm data-[state=active]:border data-[state=active]:border-[#C8CDD7]"
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
        <TabsContent value="methods">
          <PaymentsMethodsTab onAddFunds={() => setTab("funding")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const ParentPaymentsCenter = PaymentsCenter
