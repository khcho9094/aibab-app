'use client'

import { useTransition } from 'react'
import { deleteIngredient, toggleFavorite } from '@/lib/actions/ingredients'

export function DeleteIngredientButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
      onClick={() => {
        if (confirm('삭제하시겠어요?'))
          startTransition(() => deleteIngredient(id))
      }}
      disabled={pending}
    >
      삭제
    </button>
  )
}

export function FavoriteButton({
  id,
  isFavorite,
}: {
  id: string
  isFavorite: boolean
}) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      className="text-lg disabled:opacity-50"
      onClick={() => startTransition(() => toggleFavorite(id, isFavorite))}
      disabled={pending}
      title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  )
}
