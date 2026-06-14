"use client"

import { useState } from "react"
import { mockInventory } from "@/data/mockInventory"

export default function InventoryPage() {
  const [inventory, setInventory] = useState(mockInventory)

  function increaseStock(id: number) {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  function decreaseStock(id: number) {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity > 0
                  ? item.quantity - 1
                  : 0,
            }
          : item
      )
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Inventory Management
          </h1>

          <p className="mt-2 text-slate-400">
            Cafeteria inventory monitoring and stock alerts
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {inventory.map((item) => {
            const isLowStock =
              item.quantity <= item.lowStockThreshold

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >

                <div className="flex items-start justify-between">

                  <div>
                    <h2 className="text-2xl font-bold">
                      {item.itemName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.category}
                    </p>
                  </div>

                  {isLowStock ? (
                    <div className="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs font-semibold text-red-300">
                      LOW STOCK
                    </div>
                  ) : (
                    <div className="rounded-full border border-green-700 bg-green-950 px-3 py-1 text-xs font-semibold text-green-300">
                      IN STOCK
                    </div>
                  )}

                </div>

                <div className="mt-6 space-y-4">

                  <div>
                    <div className="text-sm text-slate-400">
                      Current Quantity
                    </div>

                    <div
                      className={`text-4xl font-bold ${
                        isLowStock
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {item.quantity}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                    <div className="flex items-center justify-between">

                      <div>
                        <div className="text-sm text-slate-400">
                          Low Stock Threshold
                        </div>

                        <div className="font-semibold">
                          {item.lowStockThreshold}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400">
                          Expiration
                        </div>

                        <div className="font-semibold">
                          {item.expirationDate}
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      onClick={() => increaseStock(item.id)}
                      className="rounded-xl bg-green-600 px-4 py-3 font-semibold transition hover:bg-green-500"
                    >
                      Add Stock
                    </button>

                    <button
                      onClick={() => decreaseStock(item.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-500"
                    >
                      Remove Stock
                    </button>

                  </div>

                </div>

              </div>
            )
          })}

        </div>

      </div>
    </main>
  )
}