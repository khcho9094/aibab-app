// 레시피 사전 생성 스크립트
// 실행: node scripts/generate-recipes.mjs
// 월령 4그룹 × 주요 재료 20종 조합으로 레시피 생성 후 Supabase에 저장

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local 수동 로드
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

// ── 설정 ────────────────────────────────────────────────
const AGE_GROUPS = [
  { label: '초기이유식', min: 4, max: 6, desc: '4~6개월 (초기 이유식)' },
  { label: '중기이유식', min: 6, max: 9, desc: '6~9개월 (중기 이유식)' },
  { label: '후기이유식', min: 9, max: 12, desc: '9~12개월 (후기 이유식)' },
  { label: '유아식', min: 12, max: 36, desc: '12개월 이상 (유아식)' },
]

const MAIN_INGREDIENTS = [
  '당근', '감자', '고구마', '애호박', '브로콜리',
  '시금치', '소고기', '닭고기', '두부', '달걀',
  '쌀', '오트밀', '사과', '바나나', '배',
  '단호박', '양파', '무', '연두부', '쌀미음',
]

// 월령별 금지 재료 (자동 필터링)
const FORBIDDEN = {
  all: [],
  under12: ['꿀', '생우유', '우유'],
  allergy_note: ['견과류', '땅콩'],
}

function getForbiddenForAge(maxMonths) {
  if (maxMonths <= 12) return [...FORBIDDEN.all, ...FORBIDDEN.under12]
  return FORBIDDEN.all
}

// ── 레시피 생성 프롬프트 ─────────────────────────────────
function buildPrompt(ingredient, ageGroup) {
  const forbidden = getForbiddenForAge(ageGroup.max)
  const forbiddenStr = forbidden.length > 0
    ? `\n금지 재료 (절대 포함 금지): ${forbidden.join(', ')}`
    : ''

  return `당신은 소아 영양 전문가입니다. 아래 조건에 맞는 이유식/유아식 레시피 1개를 JSON으로 작성하세요.

조건:
- 주재료: ${ingredient}
- 대상 월령: ${ageGroup.desc}${forbiddenStr}
- 나트륨 최소화 (간은 하지 않거나 극소량)
- 단계별 조리법은 3~5단계로 간단하게

반드시 아래 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{
  "title": "레시피 제목",
  "description": "한 줄 설명 (40자 이내)",
  "steps": ["1단계", "2단계", "3단계"],
  "tip": "보관 또는 조리 팁 (선택)",
  "ingredients": [
    { "name": "재료명", "quantity": "양", "is_optional": false }
  ]
}`
}

// ── 금지 재료 검증 ────────────────────────────────────────
function validateRecipe(recipe, ageGroup) {
  const forbidden = getForbiddenForAge(ageGroup.max)
  const allText = JSON.stringify(recipe).toLowerCase()
  for (const f of forbidden) {
    if (allText.includes(f.toLowerCase())) {
      return { valid: false, reason: `금지 재료 포함: ${f}` }
    }
  }
  return { valid: true }
}

// ── 메인 실행 ────────────────────────────────────────────
async function generateRecipe(ingredient, ageGroup) {
  const prompt = buildPrompt(ingredient, ageGroup)

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSON 파싱 실패')

  return JSON.parse(jsonMatch[0])
}

async function saveRecipe(recipe, ageGroup) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      title: recipe.title,
      description: recipe.description,
      age_min_months: ageGroup.min,
      age_max_months: ageGroup.max,
      steps: recipe.steps,
      tip: recipe.tip || null,
      is_ai_generated: true,
      verified_status: 'ai_beta',
    })
    .select('id')
    .single()

  if (error) throw error

  if (recipe.ingredients?.length) {
    await supabase.from('recipe_ingredients').insert(
      recipe.ingredients.map(ing => ({
        recipe_id: data.id,
        ingredient_name: ing.name,
        quantity: ing.quantity || null,
        is_optional: ing.is_optional ?? false,
      }))
    )
  }

  return data.id
}

async function main() {
  console.log('🍚 아이밥 레시피 생성 시작\n')

  let success = 0
  let fail = 0

  for (const ageGroup of AGE_GROUPS) {
    console.log(`\n▶ ${ageGroup.desc}`)

    for (const ingredient of MAIN_INGREDIENTS) {
      try {
        process.stdout.write(`  ${ingredient} ... `)

        const recipe = await generateRecipe(ingredient, ageGroup)
        const validation = validateRecipe(recipe, ageGroup)

        if (!validation.valid) {
          console.log(`⚠ 건너뜀 (${validation.reason})`)
          fail++
          continue
        }

        await saveRecipe(recipe, ageGroup)
        console.log(`✓ "${recipe.title}"`)
        success++

        // API 레이트 리밋 방지 (500ms 간격)
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        console.log(`✗ 오류: ${e.message}`)
        fail++
      }
    }
  }

  console.log(`\n✅ 완료: 성공 ${success}개, 실패 ${fail}개`)
}

main().catch(console.error)
