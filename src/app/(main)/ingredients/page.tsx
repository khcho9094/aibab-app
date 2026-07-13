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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('expiry_date', { ascending: true, nullsFirst: false })

  const favorites = ingredients?.filter((i) => i.is_favorite) ?? []
  const others = ingredients?.filter((i) => !i.is_favorite) ?? []

  function IngredientRow({ item }: { item: Ingredient }) {
    const status = getExpiryStatus(item.expiry_date)
    return (
      <div className="flex items-center gap-3 py-3.5 border-b last:border-0">
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
        <div className="bg-orange-50 rounded-2xl p-8 text-center mt-8">
          <p className="text-5xl mb-3">🥕</p>
          <p className="font-medium text-gray-700 mb-1">식재료를 등록해보세요</p>
          <p className="text-sm text-gray-500 mb-4">보유한 재료로 맞는 레시피를 추천해드려요</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full px-6">
            <Link href="/ingredients/new">첫 번째 식재료 추가하기</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm divide-y-0">
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
