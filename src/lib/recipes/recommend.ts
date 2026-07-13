import { createClient } from '@/lib/supabase/server'
import { calcAgeMonths } from '@/lib/utils/age'

export type RecipeWithScore = {
  id: string
  title: string
  description: string | null
  age_min_months: number
  age_max_months: number | null
  steps: string[]
  tip: string | null
  is_ai_generated: boolean
  verified_status: string
  matched_count: number
  total_count: number
  missing_ingredients: string[]
}

export async function getRecommendedRecipes(childId: string): Promise<RecipeWithScore[]> {
  const supabase = createClient()

  // 0. 인증 확인 + user 획득
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 1. 아이 정보 조회 (소유권 검증 포함)
  const { data: child } = await supabase
    .from('children')
    .select('birthdate')
    .eq('id', childId)
    .eq('user_id', user.id)
    .single()
  if (!child) return []

  // 2. 아이 월령 계산
  const months = calcAgeMonths(child.birthdate)

  // 3. 알레르기 + 식재료 병렬 조회
  const [{ data: allergies }, { data: ingredients }] = await Promise.all([
    supabase.from('child_allergies').select('ingredient_name').eq('child_id', childId),
    supabase.from('ingredients').select('canonical_name, name').eq('user_id', user.id),
  ])

  const allergyNames = (allergies ?? []).map(a => a.ingredient_name.toLowerCase())
  const ownedCanonical = new Set(
    (ingredients ?? []).map(i => (i.canonical_name ?? i.name).toLowerCase())
  )

  // 5. 월령에 맞는 레시피 + 재료 조회
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`*, recipe_ingredients(ingredient_name, is_optional)`)
    .lte('age_min_months', months)
    .or(`age_max_months.is.null,age_max_months.gte.${months}`)

  if (!recipes) return []

  // 6. 알레르기 필터링 + 매칭 점수 계산
  const scored: RecipeWithScore[] = []

  for (const recipe of recipes) {
    const recipeIngredients: { ingredient_name: string; is_optional: boolean }[] =
      recipe.recipe_ingredients ?? []

    // 알레르기 재료 포함 여부 확인
    const hasAllergen = recipeIngredients.some(ri =>
      allergyNames.some(a => ri.ingredient_name.toLowerCase().includes(a))
    )
    if (hasAllergen) continue

    // 필수 재료만 매칭 계산
    const required = recipeIngredients.filter(ri => !ri.is_optional)
    const missing = required.filter(
      ri => !ownedCanonical.has(ri.ingredient_name.toLowerCase())
    )

    scored.push({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      age_min_months: recipe.age_min_months,
      age_max_months: recipe.age_max_months,
      steps: recipe.steps,
      tip: recipe.tip,
      is_ai_generated: recipe.is_ai_generated,
      verified_status: recipe.verified_status,
      matched_count: required.length - missing.length,
      total_count: required.length,
      missing_ingredients: missing.map(ri => ri.ingredient_name),
    })
  }

  // 7. 점수 정렬: 재료 매칭률 높은 순
  scored.sort((a, b) => {
    const scoreA = a.total_count > 0 ? a.matched_count / a.total_count : 0
    const scoreB = b.total_count > 0 ? b.matched_count / b.total_count : 0
    return scoreB - scoreA
  })

  return scored
}
