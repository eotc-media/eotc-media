import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import EditProfileForm from "@/app/profile/edit/EditProfileForm"

export const dynamic = 'force-dynamic'

export default async function EditProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  const spellings = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { nameAm: true, nameEn: true },
  })
  const user = {
    name: session.user.name || '',
    nameAm: spellings?.nameAm ?? '',
    nameEn: spellings?.nameEn ?? '',
    email: session.user.email || '',
    image: session.user.image || null,
    roles: session.user.roles || []
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <EditProfileForm user={user} />
      </div>
      <Footer />
    </>
  )
}
