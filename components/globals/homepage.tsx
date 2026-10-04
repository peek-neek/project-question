import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { deleteQuestionType } from "@/app/admin/actions"
import { getQuestionTypes } from "@/components/constant/store"
import AdminToggle from "@/components/globals/adminToggle"
import ConfirmDelete from "@/components/globals/confirmDelete"
import { EditQuestionType } from "@/components/globals/editDialogs"
import { isAdmin } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default async function Homepage() {
  const [types, admin] = await Promise.all([getQuestionTypes(), isAdmin()])

  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div className="fixed top-6 right-6 z-20">
        <AdminToggle enabled={admin} />
      </div>
      {/* Phone: two fixed-width columns, centered (an odd last tile sits under
          the first column). md+: a single centered row. Tiles stretch to the
          tallest in their row, so admin mode grows them evenly */}
      <div className="grid grid-cols-[repeat(2,9rem)] justify-center gap-3 md:flex md:w-full md:max-w-6xl md:flex-wrap">
        {types.map((type, index) => (
          // The link is stretched over the tile so the edit/delete buttons can sit
          // inside it without nesting a <button> in an <a>
          <div
            key={type.id}
            className={cn(
              "relative flex min-h-28 w-36 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center text-sm leading-tight font-medium text-white shadow-sm transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
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
            <span>
              <span className="opacity-80">{index + 1}.</span> {type.label}
            </span>
            {admin && (
              <div className="-mb-1 flex items-center gap-1">
                <EditQuestionType
                  type={{
                    slug: type.slug,
                    label: type.label,
                    icon: type.icon,
                    color: type.color,
                  }}
                  className="text-white/80 hover:bg-black/15 hover:text-white"
                />
                <ConfirmDelete
                  action={deleteQuestionType.bind(null, type.slug)}
                  title={`Delete "${type.label}"?`}
                  description={`This permanently removes the category and all ${type.questions.length} of its questions.`}
                  label={`Delete ${type.label}`}
                  className="text-white/80 hover:bg-black/15 hover:text-white"
                />
              </div>
            )}
          </div>
        ))}
        {admin && (
          <Link
            href="/submit"
            aria-label="Add questions"
            className="flex min-h-28 w-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-sm leading-tight font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <PlusIcon className="size-6" />
          </Link>
        )}
      </div>
    </main>
  )
}
