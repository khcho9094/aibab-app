import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { child?: string }
}) {
  const supabase = createClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select(`*, recipe_ingredients(ingredient_name, quantity, is_optional)`)
    .eq('id', params.id)
    .single()

  if (!recipe) notFound()

  const backUrl = searchParams.child
    ? `/recipes?child=${searchParams.child}`
    : '/recipes'

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href={backUrl} className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">{recipe.title}</h1>
      </div>

      {/* 배지 */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">
          {recipe.age_min_months}~{recipe.age_max_months ?? ''}개월
        </Badge>
        {recipe.verified_status === 'verified' ? (
          <Badge className="bg-green-500">✅ 검수 완료</Badge>
        ) : (
          <Badge variant="secondary">🤖 AI 생성 (베타)</Badge>
        )}
      </div>

      {/* 설명 */}
      {recipe.description && (
        <p className="text-gray-600 text-sm">{recipe.description}</p>
      )}

      {/* 재료 */}
      {recipe.recipe_ingredients?.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-4">
          <h2 className="font-semibold mb-3">🥕 재료</h2>
          <ul className="space-y-1.5">
            {recipe.recipe_ingredients.map(
              (ri: { ingredient_name: string; quantity: string | null; is_optional: boolean }) => (
                <li key={ri.ingredient_name} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>{ri.ingredient_name}</span>
                  {ri.quantity && (
                    <span className="text-gray-400">{ri.quantity}</span>
                  )}
                  {ri.is_optional && (
                    <span className="text-xs text-gray-400">(선택)</span>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* 조리 단계 */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-3">👩‍🍳 조리 방법</h2>
        <ol className="space-y-3">
          {(recipe.steps ?? []).map((step: string, i: number) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 팁 */}
      {recipe.tip && (
        <div className="bg-yellow-50 rounded-xl p-4 text-sm text-gray-600">
          <span className="font-semibold">💡 팁</span> {recipe.tip}
        </div>
      )}

      {/* 면책 문구 */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        이 레시피는 참고용입니다. 아이의 건강 상태에 따라 소아과 전문의와 상담하세요.
      </p>
    </div>
  )
}
