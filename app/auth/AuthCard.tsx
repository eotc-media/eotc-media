import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

/** The frame the sign-in page uses, shared by the password reset pages. */
export default function AuthCard({ title, subtitle, children }: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center bg-gray-50 py-20">
        <div className="w-full sm:max-w-md px-6 py-6 bg-white shadow-lg sm:rounded-xl">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image src="/icons/icon.png" alt="EOTC Media" width={48} height={48} unoptimized priority />
            </Link>
          </div>
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
            <p className="text-gray-600 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}
