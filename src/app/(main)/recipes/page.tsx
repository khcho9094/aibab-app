import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { getRecommendedRecipes } from '@/lib/recipes/recommend'
import { formatAgeLabel, calcAgeMonths } from '@/lib/utils/age'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { child?: string }
}) {
  const supabase = createClient()

  const { data: children } = await supabase
    .from('children')
    .select('id, name, birthdate')
    .order('created_at')

  const selectedId = searchParams.child ?? children?.[0]?.id
  const selectedChild = children?.find(c => c.id === selectedId)

  const recipes = selectedId ? await getRecommendedRecipes(selectedId) : []

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">📖 레시피 추천</h1>

      {/* 아이 선택 */}
      {children && children.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {children.map(child => {
            const months = calcAgeMonths(child.birthdate)
            const active = child.id === selectedId
            return (
              <Link
                key={child.id}
                href={`/recipes?child=${child.id}`}
                className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {child.name} ({formatAgeLabel(months)})
              </Link>
            )
          })}
        </div>
      )}

      {!children?.length && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👶</p>
          <p className="text-sm">
            먼저{' '}
            <Link href="/children/new" className="text-orange-500 underline">
              아이 프로필을 등록
            </Link>
            해주세요
          </p>
        </div>
      )}

      {selectedChild && recipes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🥕</p>
          <p className="text-sm">
            맞는 레시피가 없어요.{' '}
            <Link href="/ingredients/new" className="text-orange-500 underline">
              식재료를 추가
            </Link>
            해보세요!
          </p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="space-y-3">
          {recipes.map(recipe => {
            const matchPct = recipe.total_count > 0
              ? Math.round((recipe.matched_count / recipe.total_count) * 100)
              : 100
            const hasMissing = recipe.missing_ingredients.length > 0

            return (
              <Link key={recipe.id} href={`/recipes/${recipe.id}?child=${selectedId}`}>
                <div className={`bg-white rounded-xl p-4 border transition-colors hover:border-orange-300 ${
                  hasMissing ? 'opacity-80' : ''
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{recipe.title}</p>
                      {recipe.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{recipe.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={matchPct === 100 ? 'default' : 'secondary'}
                      className={matchPct === 100 ? 'bg-orange-500 shrink-0' : 'shrink-0'}
                    >
                      {matchPct === 100 ? '보유 재료 완보' : `${matchPct}% 매칭`}
                    </Badge>
                  </div>
                  {hasMissing && (
                    <p className="text-xs text-gray-400 mt-2">
                      필요: {recipe.missing_ingredients.join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
