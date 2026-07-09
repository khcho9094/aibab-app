import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { calcAgeMonths, formatAgeLabel } from '@/lib/utils/age'

export default async function ChildrenPage() {
  const supabase = createClient()
  const { data: children } = await supabase
    .from('children')
    .select('*')
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
        <div className="space-y-3">
          {children.map((child) => {
            const months = calcAgeMonths(child.birthdate)
            return (
              <Link key={child.id} href={`/children/${child.id}`}>
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-orange-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👶</span>
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
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👶</p>
          <p className="text-sm mb-4">아이 프로필을 추가해보세요</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/children/new">첫 번째 아이 추가하기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
