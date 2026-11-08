"use client"

import { useState, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import InputError from "@/components/InputError"
import AuthCard from "../AuthCard"

function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setErrors({ password: "Password must be at least 8 characters" })
    if (password !== confirm) return setErrors({ confirm: "The passwords don't match" })
    setIsLoading(true)
    setErrors({})
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) return router.push("/auth/login?reset=1")
      const data = await res.json().catch(() => null)
      setErrors(data?.errors ?? { form: data?.message ?? "Something went wrong. Please try again." })
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthCard title="Link not valid" subtitle="This reset link is incomplete. Ask for a new one.">
        <div className="text-center">
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Send a new link</Link>
        </div>
      </AuthCard>
    )
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, error?: string) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-lock text-gray-400"></i>
        </div>
        <input
          id={id}
          type="password"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="••••••••"
          value={value}
          onChange={(e) => set(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
      <InputError message={error} />
    </div>
  )

  return (
    <AuthCard title="Choose a new password" subtitle="At least 8 characters.">
      {errors.form && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {errors.form}{" "}
          <Link href="/auth/forgot-password" className="font-medium underline">Send a new link</Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {field("password", "New password", password, setPassword, errors.password)}
        {field("confirm", "Confirm new password", confirm, setConfirm, errors.confirm)}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
