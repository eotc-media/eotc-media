"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import InputError from "@/components/InputError"
import AuthCard from "../AuthCard"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSent(true)
      else setError((await res.json().catch(() => null))?.message ?? "Something went wrong. Please try again.")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle={`If ${email} has an account, we've sent a link to reset your password.`}>
        <p className="text-sm text-gray-600 text-center">
          The link works for one hour. Don&apos;t see it? Check your spam folder.
        </p>
        <div className="mt-5 text-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to sign in</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-envelope text-gray-400"></i>
            </div>
            <input
              id="email"
              type="email"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <InputError message={error} />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <div className="mt-5 text-center">
        <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to sign in</Link>
      </div>
    </AuthCard>
  )
}
