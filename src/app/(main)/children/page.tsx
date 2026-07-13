import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { calcAgeMonths, formatAgeLabel } from '@/lib/utils/age'

export default async function ChildrenPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">👶 아이 프로필</h1>
        <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Link href="/children/new">+ 추가</Link>
        </Button>
      </div>

      {children && children.length > 0 ? (
        <div className="space-y-3.5">
          {children.map((child) => {
            const months = calcAgeMonths(child.birthdate)
            return (
              <Link key={child.id} href={`/children/${child.id}`}>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-base shrink-0">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{child.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatAgeLabel(months)}{' '}
                        <span className="text-gray-400">({months}개월)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-orange-50 rounded-2xl p-8 text-center mt-8">
          <p className="text-5xl mb-3">👶</p>
          <p className="font-medium text-gray-700 mb-1">아이 프로필을 등록해보세요</p>
          <p className="text-sm text-gray-500 mb-4">아이 월령에 맞는 레시피를 추천해드려요</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full px-6">
            <Link href="/children/new">첫 번째 아이 등록하기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
