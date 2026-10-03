"use client"

import { useState, useTransition } from "react"
import { Dialog } from "radix-ui"
import { CheckIcon, PencilIcon } from "lucide-react"

import {
  updateQuestion,
  updateQuestionType,
  type EditResult,
} from "@/app/admin/actions"
import {
  COLOR_PALETTE,
  type QuestionAnswer,
  type QuestionType,
} from "@/components/constant/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

// Pencil trigger + dialog shell shared by both editors
function EditDialog({
  title,
  label,
  className,
  onOpen,
  onSave,
  children,
}: {
  title: string
  // Accessible name for the icon button
  label: string
  className?: string
  // Called when the dialog opens, to reset the fields to current values
  onOpen: () => void
  onSave: () => Promise<EditResult>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onOpenChange(next: boolean) {
    if (next) {
      onOpen()
      setError(null)
    }
    setOpen(next)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await onSave()
        if (result.error) setError(result.error)
        else setOpen(false)
      } catch {
        setError("Couldn't reach the server. Please try again.")
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "relative z-10 inline-flex shrink-0 items-center justify-center rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            className
          )}
        >
          <PencilIcon className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <Dialog.Title className="font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Edit the fields and save your changes.
          </Dialog.Description>
          <form onSubmit={save} className="mt-4 flex flex-col gap-4">
            {children}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function EditQuestionType({
  type,
  className,
}: {
  type: Pick<QuestionType, "slug" | "label" | "icon" | "color">
  className?: string
}) {
  const [label, setLabel] = useState(type.label)
  const [icon, setIcon] = useState(type.icon)
  const [color, setColor] = useState(type.color)

  return (
    <EditDialog
      title="Edit category"
      label={`Edit ${type.label}`}
      className={className}
      onOpen={() => {
        setLabel(type.label)
        setIcon(type.icon)
        setColor(type.color)
      }}
      onSave={() => updateQuestionType(type.slug, { label, icon, color })}
    >
      <div className="flex gap-3">
        <label className="flex w-20 shrink-0 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Emoji</span>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={8}
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Name</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className={inputClass}
          />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs text-muted-foreground">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-label={option.split(" ")[0].replace("bg-", "")}
              aria-pressed={color === option}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:ring-2 aria-pressed:ring-foreground",
                option
              )}
            >
              {color === option && <CheckIcon className="size-4" />}
            </button>
          ))}
        </div>
      </fieldset>
    </EditDialog>
  )
}

export function EditQuestion({
  slug,
  qa,
  className,
}: {
  slug: string
  qa: QuestionAnswer
  className?: string
}) {
  const [question, setQuestion] = useState(qa.question)
  const [answer, setAnswer] = useState(qa.answer)

  return (
    <EditDialog
      title="Edit question"
      label={`Edit question: ${qa.question}`}
      className={className}
      onOpen={() => {
        setQuestion(qa.question)
        setAnswer(qa.answer)
      }}
      onSave={() => updateQuestion(slug, qa.id, { question, answer })}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Question</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">
          Answer (blank lines start a new paragraph)
        </span>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          rows={8}
          className={`${inputClass} resize-y`}
        />
      </label>
    </EditDialog>
  )
}
