import Link from 'next/link'
import IngredientForm from './ingredient-form'

export default function NewIngredientPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ingredients" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-xl font-bold">식재료 추가</h1>
      </div>
      <IngredientForm error={searchParams.error} />
    </div>
  )
}
