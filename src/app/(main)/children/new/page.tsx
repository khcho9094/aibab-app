import Link from 'next/link'
import { createChild } from '@/lib/actions/children'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewChildPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/children" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">아이 추가</h1>
      </div>

      <form action={createChild} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">이름</Label>
          <Input id="name" name="name" placeholder="아이 이름" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthdate">생년월일</Label>
          <Input
            id="birthdate"
            name="birthdate"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {searchParams.error && (
          <p className="text-sm text-red-500">{searchParams.error}</p>
        )}

        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
          저장하기
        </Button>
      </form>
    </div>
  )
}
