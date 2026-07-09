import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { calcAgeMonths, formatAgeLabel } from '@/lib/utils/age'
import { updateChild, addAllergy } from '@/lib/actions/children'
import { DeleteChildButton, DeleteAllergyButton } from './delete-buttons'

export default async function ChildDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string }
}) {
  const supabase = createClient()

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!child) notFound()

  const { data: allergies } = await supabase
    .from('child_allergies')
    .select('*')
    .eq('child_id', params.id)
    .order('created_at', { ascending: true })

  const months = calcAgeMonths(child.birthdate)
  const updateChildWithId = updateChild.bind(null, params.id)
  const addAllergyWithId = addAllergy.bind(null, params.id)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/children" className="text-gray-400 hover:text-gray-600 text-xl">
            ←
          </Link>
          <h1 className="text-xl font-bold">{child.name}</h1>
        </div>
        <DeleteChildButton childId={child.id} />
      </div>

      {/* 현재 월령 */}
      <div className="bg-orange-50 rounded-xl p-4 text-center">
        <p className="text-3xl font-bold text-orange-500">{formatAgeLabel(months)}</p>
        <p className="text-sm text-gray-500 mt-1">{months}개월 · {child.birthdate}</p>
      </div>

      {/* 프로필 수정 폼 */}
      <div className="bg-white rounded-xl p-4 border">
        <h2 className="font-semibold mb-4">프로필 수정</h2>
        <form action={updateChildWithId} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" defaultValue={child.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthdate">생년월일</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={child.birthdate}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          {searchParams.error && (
            <p className="text-sm text-red-500">{searchParams.error}</p>
          )}
          <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600">
            저장
          </Button>
        </form>
      </div>

      {/* 알레르기 관리 */}
      <div className="bg-white rounded-xl p-4 border">
        <h2 className="font-semibold mb-4">🚨 알레르기</h2>

        {allergies && allergies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {allergies.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1">
                <Badge variant={a.severity === 'severe' ? 'destructive' : 'secondary'}>
                  {a.ingredient_name}
                </Badge>
                <DeleteAllergyButton allergyId={a.id} childId={child.id} />
              </span>
            ))}
          </div>
        )}

        <form action={addAllergyWithId} className="space-y-3">
          <div className="flex gap-2">
            <Input
              name="ingredient_name"
              placeholder="재료명 (예: 달걀)"
              className="flex-1"
              required
            />
            <select
              name="severity"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="mild">열등(mild)</option>
              <option value="severe">심함(severe)</option>
            </select>
          </div>
          <Button type="submit" size="sm" variant="outline" className="w-full">
            + 알레르기 추가
          </Button>
        </form>
      </div>
    </div>
  )
}
