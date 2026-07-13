'use client'

import { useTransition } from 'react'
import { deleteChild, deleteAllergy } from '@/lib/actions/children'
import { Button } from '@/components/ui/button'

export function DeleteChildButton({ childId }: { childId: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('정말 삭제하시겠어요? 이 아이의 모든 기록이 삭제됩니다.')) return
    startTransition(() => deleteChild(childId))
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-500 border-red-200 hover:bg-red-50"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? '삭제 중...' : '삭제'}
    </Button>
  )
}

export function DeleteAllergyButton({
  allergyId,
  childId,
}: {
  allergyId: string
  childId: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      className="text-gray-400 hover:text-red-500 text-xs ml-1 disabled:opacity-50"
      onClick={() => {
        if (!confirm('알레르기를 삭제할게요?'))
          return
        startTransition(() => deleteAllergy(allergyId, childId))
      }}
      disabled={pending}
    >
      ✕
    </button>
  )
}
