"use client"

import { useActionState, useRef, useState, useTransition } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Dialog, Switch } from "radix-ui"

import { lockAdmin, unlockAdmin, type UnlockState } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function AdminToggle({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [passcode, setPasscode] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const [locking, startLocking] = useTransition()
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockAdmin,
    { error: null }
  )

  function onCheckedChange(checked: boolean) {
    if (checked) {
      setPasscode("")
      setOpen(true)
    } else {
      setOpen(false)
      startLocking(() => lockAdmin())
    }
  }

  return (
    <>
      <label className="flex items-center gap-2 text-sm font-medium">
        Admin
        <Switch.Root
          checked={enabled}
          onCheckedChange={onCheckedChange}
          disabled={locking}
          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-input transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 data-[state=checked]:bg-primary"
        >
          <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-4.5" />
        </Switch.Root>
      </label>

      {/* Closes itself once the server re-renders with enabled=true */}
      <Dialog.Root open={open && !enabled} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-semibold">Admin mode</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Enter the 4-digit passcode.
            </Dialog.Description>
            <form
              ref={formRef}
              action={formAction}
              className="mt-4 flex flex-col gap-3"
            >
              <InputOTP
                name="passcode"
                maxLength={4}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                value={passcode}
                onChange={setPasscode}
                // Submit as soon as the 4th digit is entered
                onComplete={() => formRef.current?.requestSubmit()}
                autoFocus
                aria-label="Passcode"
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="size-12 text-lg" />
                  <InputOTPSlot index={1} className="size-12 text-lg" />
                  <InputOTPSlot index={2} className="size-12 text-lg" />
                  <InputOTPSlot index={3} className="size-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
              {state.error && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={pending || passcode.length !== 4}
              >
                {pending ? "Checking…" : "Unlock"}
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
