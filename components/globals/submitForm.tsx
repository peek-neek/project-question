"use client"

import { useActionState, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { submitQuestions, type SubmitState } from "@/app/submit/actions"
import { CUSTOM_CATEGORY } from "@/components/constant/data"
import { Button } from "@/components/ui/button"

type Row = { key: number; question: string; answer: string }

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

export default function SubmitForm({
  categories,
}: {
  categories: { slug: string; label: string; icon: string }[]
}) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitQuestions,
    { error: null }
  )

  // Inputs are controlled so values survive a failed submit (React resets
  // uncontrolled fields after a form action runs)
  const [category, setCategory] = useState(
    categories[0]?.slug ?? CUSTOM_CATEGORY
  )
  const [customLabel, setCustomLabel] = useState("")
  const [customIcon, setCustomIcon] = useState("")
  const [rows, setRows] = useState<Row[]>([
    { key: 0, question: "", answer: "" },
  ])
  const [nextKey, setNextKey] = useState(1)

  const isCustom = category === CUSTOM_CATEGORY

  function updateRow(key: number, field: "question" | "answer", value: string) {
    setRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  function addRow() {
    setRows((rows) => [...rows, { key: nextKey, question: "", answer: "" }])
    setNextKey((key) => key + 1)
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          {categories.map((type) => (
            <option key={type.slug} value={type.slug}>
              {type.icon} {type.label}
            </option>
          ))}
          <option value={CUSTOM_CATEGORY}>➕ New category…</option>
        </select>

        {isCustom && (
          <div className="flex gap-3">
            <label className="flex w-24 shrink-0 flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Emoji</span>
              <input
                name="customIcon"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="?"
                maxLength={8}
                className={inputClass}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                What should this category be called?
              </span>
              <input
                name="customLabel"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Warranty"
                required
                className={inputClass}
              />
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-medium">
          Questions & answers
        </legend>
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="flex flex-col gap-2 rounded-xl border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                #{i + 1}
              </span>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove question ${i + 1}`}
                  onClick={() =>
                    setRows((rows) => rows.filter((r) => r.key !== row.key))
                  }
                >
                  <Trash2Icon />
                </Button>
              )}
            </div>
            <input
              name="question"
              value={row.question}
              onChange={(e) => updateRow(row.key, "question", e.target.value)}
              placeholder="Question"
              aria-label={`Question ${i + 1}`}
              className={inputClass}
            />
            <textarea
              name="answer"
              value={row.answer}
              onChange={(e) => updateRow(row.key, "answer", e.target.value)}
              placeholder="Answer (blank lines start a new paragraph)"
              aria-label={`Answer ${i + 1}`}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="self-start"
        >
          <PlusIcon /> Add another
        </Button>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="self-end px-5"
      >
        {pending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  )
}
