"use client"

import { useState } from "react"

export default function AgreementPage() {
  const [signed, setSigned] = useState(false)

  function handleAgreement() {
    setSigned(true)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-4xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Cafeteria Agreement Form
          </h1>

          <p className="mt-2 text-slate-400">
            Parent and guardian cafeteria policy acknowledgment
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-6">

          <div>
            <h2 className="text-2xl font-bold">
              Madonna High School Food Services Agreement
            </h2>

            <p className="mt-4 text-slate-300 leading-8">
              By using the Madonna Nutrition Management System and
              participating in cafeteria meal services, parents and
              guardians acknowledge responsibility for maintaining
              accurate student dietary information, reviewing meal
              balances, and communicating allergy or dietary concerns
              to school administration.
            </p>

            <p className="mt-4 text-slate-300 leading-8">
              Parents and guardians understand that cafeteria balances
              should remain current and that low balance notifications
              may be sent automatically through the platform.
            </p>

            <p className="mt-4 text-slate-300 leading-8">
              Madonna High School will make reasonable efforts to
              accommodate documented dietary restrictions and allergy
              concerns entered into the system.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

            <div className="flex items-start gap-4">

              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
              />

              <div>
                <div className="font-semibold">
                  Agreement Acknowledgment
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  I acknowledge and agree to the cafeteria terms,
                  balance responsibilities, and allergy communication
                  expectations outlined above.
                </p>
              </div>

            </div>

          </div>

          <button
            onClick={handleAgreement}
            className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold transition hover:bg-blue-500"
          >
            Digitally Sign Agreement
          </button>

          {signed && (
            <div className="rounded-xl border border-green-700 bg-green-950 p-5 text-green-300">

              <div className="text-lg font-semibold">
                Agreement Successfully Signed
              </div>

              <p className="mt-2 text-sm">
                Parent acknowledgment has been digitally recorded.
              </p>

            </div>
          )}

        </div>

      </div>
    </main>
  )
}