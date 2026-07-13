'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { type ComponentProps } from 'react'

type Props = ComponentProps<typeof Button> & { pendingText?: string }

export function SubmitButton({ children, pendingText = '저장 중...', ...props }: Props) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  )
}
