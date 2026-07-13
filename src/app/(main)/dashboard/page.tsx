import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calcAgeMonths, formatAgeLabel } from '@/lib/utils/age'
import { getRecommendedRecipes } from '@/lib/recipes/recommend'

function getDaysUntilExpiry(expiryDate: string) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 유통기한 3일 이내 + 아이 목록 병렬 조회
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const [{ data: expiringItems }, { data: children }] = await Promise.all([
    supabase
      .from('ingredients')
      .select('id, name, expiry_date')
      .eq('user_id', user.id)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', threeDaysLater)
      .order('expiry_date', { ascending: true })
      .limit(5),
    supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(3),
  ])

  // 첫 번째 아이의 추천 레시피 (최대 3개)
  const firstChild = children?.[0]
  const recommendedRecipes = firstChild
    ? (await getRecommendedRecipes(firstChild.id)).slice(0, 3)
    : []

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🍚 아이밥</h1>
        <p className="text-sm text-gray-400 mt-0.5">엄마들의 도우미 레시피</p>
        </div>
        <Link href="/ingredients/new">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            + 식재료
          </Button>
        </Link>
      </div>

      {/* 유통기한 임박 경고 */}
      {expiringItems && expiringItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <h2 className="font-semibold text-red-600 mb-3">🔔 유통기한 임박</h2>
          <div className="space-y-2">
            {expiringItems.map(item => {
              const days = getDaysUntilExpiry(item.expiry_date!)
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="destructive">
                    {days < 0 ? '만료됨' : days === 0 ? '오늘 만료' : `D-${days}`}
                  </Badge>
                </div>
              )
            })}
          </div>
          <Link href="/ingredients" className="text-xs text-red-400 hover:underline mt-2 block">
            전체 식재료 보기 →
          </Link>
        </div>
      )}

      {/* 아이 프로필 */}
      {children && children.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-semibold">👶 우리 아이</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map(child => {
              const months = calcAgeMonths(child.birthdate)
              return (
                <Link key={child.id} href={`/children/${child.id}`}>
                  <div className="shrink-0 bg-white border rounded-xl px-4 py-3 hover:border-orange-300 transition-colors flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{child.name}</p>
                      <p className="text-xs text-gray-400">{formatAgeLabel(months)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
            <Link href="/children/new">
              <div className="shrink-0 bg-gray-50 border border-dashed rounded-xl px-4 py-3 hover:border-orange-300 transition-colors flex items-center">
                <span className="text-sm text-gray-400">+ 추가</span>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">아이 프로필을 등록하면 맞온 레시피를 추천해드려요</p>
          <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
            <Link href="/children/new">첫 번째 아이 등록</Link>
          </Button>
        </div>
      )}

      {/* 오늘의 추천 레시피 */}
      {firstChild && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">📖 {firstChild.name}에게 맞는 레시피</h2>
            <Link href={`/recipes?child=${firstChild.id}`} className="text-xs text-orange-500 hover:underline">
              더 보기 →
            </Link>
          </div>
          {recommendedRecipes.length > 0 ? (
            <div className="space-y-2.5">
              {recommendedRecipes.map(recipe => {
                const matchPct = recipe.total_count > 0
                  ? Math.round((recipe.matched_count / recipe.total_count) * 100)
                  : 100
                return (
                  <Link key={recipe.id} href={`/recipes/${recipe.id}?child=${firstChild.id}`}>
                    <div className="bg-white border rounded-2xl px-4 py-3 hover:border-orange-300 hover:shadow-sm transition-all flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recipe.title}</p>
                        {recipe.description && (
                          <p className="text-xs text-gray-400 truncate">{recipe.description}</p>
                        )}
                      </div>
                      <Badge
                        variant={matchPct === 100 ? 'default' : 'secondary'}
                        className={`shrink-0 ml-2 ${matchPct === 100 ? 'bg-orange-500' : ''}`}
                      >
                        {matchPct === 100 ? '✓ 재료 완비' : `${matchPct}% 보유`}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              식재료를 추가하면 레시피를 추천해드려요
            </p>
          )}
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/ingredients/new">
          <div className="bg-white border rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
            <p className="text-2xl mb-1">🥕</p>
            <p className="text-sm font-medium">식재료 추가</p>
          </div>
        </Link>
        <Link href="/children">
          <div className="bg-white border rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
            <p className="text-2xl mb-1">👶</p>
            <p className="text-sm font-medium">아이 관리</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
