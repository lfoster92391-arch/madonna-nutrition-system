"use client"

import { mockMenu } from "@/data/mockMenu"

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Weekly Lunch Menu
          </h1>

          <p className="mt-2 text-slate-400">
            Cafeteria meal planning and weekly menu scheduling
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {mockMenu.map((menu) => (
            <div
              key={menu.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    {menu.day}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Featured Lunch
                  </p>
                </div>

                <div className="rounded-full border border-blue-700 bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                  Scheduled
                </div>

              </div>

              <div className="mt-6 space-y-6">

                <div>
                  <div className="text-sm text-slate-400">
                    Main Meal
                  </div>

                  <div className="mt-2 text-3xl font-bold">
                    {menu.meal}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">
                    Side Items
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {menu.sides.map((side) => (
                      <div
                        key={side}
                        className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      >
                        {side}
                      </div>
                    ))}

                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                  <div className="text-sm text-slate-400">
                    Beverage
                  </div>

                  <div className="mt-2 text-xl font-semibold">
                    {menu.drink}
                  </div>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  )
}