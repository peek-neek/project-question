import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { getQuestionType, getQuestionTypes } from "@/components/constant/store"
import QuestionTypes from "@/components/globals/questionTypes"
import { isAdmin } from "@/lib/admin"
import { cn } from "@/lib/utils"

// Categories added later via /submit aren't listed here; they render on
// demand (dynamicParams defaults to true)
export async function generateStaticParams() {
  const types = await getQuestionTypes()
  return types.map((type) => ({ questionTypeId: type.slug }))
}

export async function generateMetadata(
  props: PageProps<"/[questionTypeId]">
): Promise<Metadata> {
  const { questionTypeId } = await props.params
  const type = await getQuestionType(questionTypeId)
  return { title: type ? type.label : "Not found" }
}

export default async function Page(props: PageProps<"/[questionTypeId]">) {
  const { questionTypeId } = await props.params
  const type = await getQuestionType(questionTypeId)
  if (!type) notFound()

  return (
    <main className="mx-auto w-full p-6">
      <QuestionTypes
        type={type}
        isAdmin={await isAdmin()}
        header={
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md p-1.5 text-foreground hover:bg-muted"
            aria-label="Back to home"
          >
            <ArrowLeftIcon className="size-4" />
            <span className={cn("size-3 rounded-full", type.color)} />
            <h1 className="text-xl font-semibold">
              <span aria-hidden className="hidden md:inline">
                {type.icon} {type.label}
              </span>
            </h1>
          </Link>
        }
      />
    </main>
  )
}
