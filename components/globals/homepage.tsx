import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { deleteQuestionType } from "@/app/admin/actions"
import { getQuestionTypes } from "@/components/constant/store"
import AdminToggle from "@/components/globals/adminToggle"
import ConfirmDelete from "@/components/globals/confirmDelete"
import { isAdmin } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default async function Homepage() {
  const [types, admin] = await Promise.all([getQuestionTypes(), isAdmin()])

  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div className="fixed top-6 right-6 z-20">
        <AdminToggle enabled={admin} />
      </div>
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 p-10 sm:p-16">
        {types.map((type) => (
          // The link is stretched over the tile so the delete button can sit
          // inside it without nesting a <button> in an <a>
          <div
            key={type.id}
            className={cn(
              "relative flex h-28 w-36 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center text-sm leading-tight font-medium text-white shadow-sm transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
              type.color
            )}
          >
            <Link
              href={`/${type.slug}`}
              aria-label={type.label}
              className="absolute inset-0 rounded-xl focus-visible:outline-none"
            />
            <span className="text-2xl" aria-hidden>
              {type.icon}
            </span>
            <span className="flex items-center gap-1">
              {type.label}
              {admin && (
                <ConfirmDelete
                  action={deleteQuestionType.bind(null, type.slug)}
                  title={`Delete "${type.label}"?`}
                  description={`This permanently removes the category and all ${type.questions.length} of its questions.`}
                  label={`Delete ${type.label}`}
                  className="text-white/80 hover:bg-black/15 hover:text-white"
                />
              )}
            </span>
          </div>
        ))}
        {admin && (
          <Link
            href="/submit"
            aria-label="Add questions"
            className="flex h-28 w-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-sm leading-tight font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <PlusIcon className="size-6" />
          </Link>
        )}
      </div>
    </main>
  )
}
