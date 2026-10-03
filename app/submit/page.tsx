import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { getQuestionTypes } from "@/components/constant/store"
import SubmitForm from "@/components/globals/submitForm"
import { isAdmin } from "@/lib/admin"

export const metadata: Metadata = { title: "Add questions" }

const SubmitPage = async () => {
  if (!(await isAdmin())) redirect("/")

  const types = await getQuestionTypes()

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md p-1.5 text-foreground hover:bg-muted"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="size-4" />
          <h1 className="text-xl font-semibold">Add questions</h1>
        </Link>
      </div>
      <SubmitForm
        categories={types.map(({ slug, label, icon }) => ({
          slug,
          label,
          icon,
        }))}
      />
    </main>
  )
}

export default SubmitPage
