"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { Dialog } from "radix-ui"
import { SearchIcon, XIcon } from "lucide-react"

import { deleteQuestion } from "@/app/admin/actions"
import type { QuestionAnswer, QuestionType } from "@/components/constant/data"
import AdminToggle from "@/components/globals/adminToggle"
import ConfirmDelete from "@/components/globals/confirmDelete"
import { EditQuestion } from "@/components/globals/editDialogs"

export default function QuestionTypes({
  type,
  header,
  isAdmin,
}: {
  type: QuestionType
  header: React.ReactNode
  isAdmin: boolean
}) {
  const [active, setActive] = useState<QuestionAnswer | null>(null)
  const [query, setQuery] = useState("")
  const pattern = useMemo(() => buildPattern(query), [query])

  return (
    <>
      {/* Negative margins let the sticky bar span main's padding edge to edge */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex items-center justify-between gap-3 bg-background px-6 pt-6 pb-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full h-8 bg-linear-to-b from-background to-transparent"
        />
        {header}
        <div className="flex w-full max-w-80 items-center justify-end gap-4">
          <label className="relative w-full max-w-64">
            <span className="sr-only">Search questions and answers</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <AdminToggle enabled={isAdmin} />
        </div>
      </div>

      {type.questions.length === 0 ? (
        <p className="rounded-2xl border p-10 text-center text-sm text-muted-foreground">
          No questions yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          {/* Negative margins push the outer cell borders under the clipped edge */}
          <div className="-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {type.questions.map((qa, index) => (
              <QuestionCard
                key={qa.id}
                qa={qa}
                number={index + 1}
                pattern={pattern}
                onOpen={() => setActive(qa)}
                adminSlug={isAdmin ? type.slug : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog.Root
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <Dialog.Title className="font-semibold">
                {active && (
                  <Highlight text={active.question} pattern={pattern} />
                )}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="overflow-y-auto p-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {active && <Highlight text={active.answer} pattern={pattern} />}
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

// Matches any of the whitespace-separated words in the query, case-insensitively
function buildPattern(query: string) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  return words.length ? new RegExp(`(${words.join("|")})`, "gi") : null
}

function Highlight({
  text,
  pattern,
}: {
  text: string
  pattern: RegExp | null
}) {
  if (!pattern) return text
  // split() with a capture group puts the matches at odd indices
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-yellow-400 text-inherit dark:bg-yellow-300 dark:text-black"
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function QuestionCard({
  qa,
  number,
  pattern,
  onOpen,
  adminSlug,
}: {
  qa: QuestionAnswer
  // Display position, 1-based (ids can have gaps after deletes)
  number: number
  pattern: RegExp | null
  onOpen: () => void
  // Category slug, only passed in admin mode to show edit/delete
  adminSlug?: string
}) {
  const answerRef = useRef<HTMLParagraphElement>(null)
  const [truncated, setTruncated] = useState(false)

  // Only make the card clickable when the answer actually overflows its clamp
  useLayoutEffect(() => {
    const el = answerRef.current
    if (!el) return
    const check = () => setTruncated(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [qa.answer])

  // Keep the wrapper element stable: swapping div <-> button would remount the
  // measured <p> and leave the observer watching a detached node.
  return (
    <div className="relative flex min-h-48 flex-col border-r border-b p-5 transition-colors has-[[data-overlay]:focus-visible]:bg-muted/50 has-[[data-overlay]:hover]:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">
          <span className="text-muted-foreground tabular-nums">{number}.</span>{" "}
          <Highlight text={qa.question} pattern={pattern} />
        </h3>
        {adminSlug && (
          <div className="-mt-0.5 -mr-1 flex shrink-0">
            <EditQuestion
              slug={adminSlug}
              qa={qa}
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
            />
            <ConfirmDelete
              action={() => deleteQuestion(adminSlug, qa.id)}
              title="Delete this question?"
              description={qa.question}
              label={`Delete question: ${qa.question}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            />
          </div>
        )}
      </div>
      <p
        ref={answerRef}
        className="mt-3 line-clamp-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground"
      >
        <Highlight text={qa.answer} pattern={pattern} />
      </p>
      {truncated && (
        <>
          <span className="mt-auto pt-3 text-xs font-medium text-primary">
            Read more
          </span>
          {/* Overlay makes the whole card clickable */}
          <button
            type="button"
            data-overlay
            onClick={onOpen}
            aria-label={`Read full answer: ${qa.question}`}
            className="absolute inset-0 cursor-pointer focus-visible:outline-none"
          />
        </>
      )}
    </div>
  )
}
