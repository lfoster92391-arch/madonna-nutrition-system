"use client"

import { useState } from "react"

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      task: "Restock Chocolate Milk Cooler",
      priority: "High",
      completed: false,
    },

    {
      id: 2,
      task: "Review Negative Balance Accounts",
      priority: "Medium",
      completed: false,
    },

    {
      id: 3,
      task: "Verify Walk-In Freezer Temperature",
      priority: "Critical",
      completed: false,
    },

    {
      id: 4,
      task: "Inspect Inventory Shipment Delivery",
      priority: "Medium",
      completed: true,
    },
  ])

  function toggleTask(id: number) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    )
  }

  function getPriorityStyles(priority: string) {
    switch (priority) {
      case "Critical":
        return "border-red-700 bg-red-950 text-red-300"

      case "High":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"

      default:
        return "border-blue-700 bg-blue-950 text-blue-300"
    }
  }

  const completedTasks = tasks.filter(
    (task) => task.completed
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-6xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Staff Task Center
            </h1>

            <p className="mt-2 text-slate-400">
              Daily cafeteria operational task management
            </p>
          </div>

          <div className="rounded-full border border-green-700 bg-green-950 px-4 py-2 text-sm font-semibold text-green-300">
            {completedTasks.length}/{tasks.length} Tasks Completed
          </div>

        </div>

        <div className="space-y-4">

          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-center justify-between gap-6">

                <div className="flex items-center gap-5">

                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`h-6 w-6 rounded border-2 ${
                      task.completed
                        ? "border-green-500 bg-green-500"
                        : "border-slate-500"
                    }`}
                  />

                  <div>
                    <h2
                      className={`text-2xl font-bold ${
                        task.completed
                          ? "line-through text-slate-500"
                          : ""
                      }`}
                    >
                      {task.task}
                    </h2>

                    <div className="mt-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getPriorityStyles(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                  </div>

                </div>

                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    task.completed
                      ? "border border-green-700 bg-green-950 text-green-300"
                      : "border border-yellow-700 bg-yellow-950 text-yellow-300"
                  }`}
                >
                  {task.completed
                    ? "Completed"
                    : "Pending"}
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  )
}