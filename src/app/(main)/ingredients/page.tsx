import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteIngredientButton, FavoriteButton } from './ingredient-buttons'

import { Ingredient } from '@/lib/types'

function getExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) return null
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (days < 0) return { label: '만료됨', variant: 'destructive' as const }
  if (days <= 3) return { label: `D-${days}`, variant: 'destructive' as const }
  if (days <= 7) return { label: `D-${days}`, variant: 'secondary' as const }
  return null
}

export default async function IngredientsPage() {
  const supabase = createClient()
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .order('is_favorite', { ascending: false })
    .order('expiry_date', { ascending: true, nullsFirst: false })

  const favorites = ingredients?.filter((i) => i.is_favorite) ?? []
  const others = ingredients?.filter((i) => !i.is_favorite) ?? []

  function IngredientRow({ item }: { item: Ingredient }) {
    const status = getExpiryStatus(item.expiry_date)
    return (
      <div className="flex items-center gap-3 py-3 border-b last:border-0">
        <FavoriteButton id={item.id} isFavorite={item.is_favorite} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-xs text-gray-400">
            {item.quantity != null && `${item.quantity}${item.unit ?? ''} · `}
            {item.category ?? ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
          <DeleteIngredientButton id={item.id} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">🥕 식재료</h1>
        <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Link href="/ingredients/new">+ 추가</Link>
        </Button>
      </div>

      {(!ingredients || ingredients.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🥕</p>
          <p className="text-sm mb-4">식재료를 추가해보세요</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/ingredients/new">첫 번째 식재료 추가하기</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y-0">
          {favorites.length > 0 && (
            <div className="px-4">
              <p className="text-xs text-gray-400 pt-3 pb-1 font-medium">⭐ 즐겨찾기</p>
              {favorites.map((item) => <IngredientRow key={item.id} item={item} />)}
            </div>
          )}
          {others.length > 0 && (
            <div className="px-4">
              {favorites.length > 0 && (
                <p className="text-xs text-gray-400 pt-3 pb-1 font-medium">전체</p>
              )}
              {others.map((item) => <IngredientRow key={item.id} item={item} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
