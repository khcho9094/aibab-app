'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

// canonical_name 조회 (ingredient_aliases 테이블)
async function resolveCanonicalName(name: string): Promise<string> {
  const supabase = createClient()
  const normalized = name.trim()
  const { data } = await supabase
    .from('ingredient_aliases')
    .select('canonical_name')
    .eq('alias', normalized)
    .single()
  return data?.canonical_name ?? normalized
}

export async function createIngredient(formData: FormData) {
  const user = await getUser()
  const supabase = createClient()
  const name = formData.get('name') as string
  const canonical_name = await resolveCanonicalName(name)

  const { error } = await supabase.from('ingredients').insert({
    user_id: user.id,
    name,
    canonical_name,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
    unit: (formData.get('unit') as string) || null,
    expiry_date: (formData.get('expiry_date') as string) || null,
    category: (formData.get('category') as string) || null,
    is_favorite: false,
  })

  if (error) redirect(`/ingredients/new?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/ingredients')
  redirect('/ingredients')
}

export async function updateIngredient(id: string, formData: FormData) {
  const user = await getUser()
  const supabase = createClient()
  const name = formData.get('name') as string
  const canonical_name = await resolveCanonicalName(name)

  const { error } = await supabase
    .from('ingredients')
    .update({
      name,
      canonical_name,
      quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
      unit: (formData.get('unit') as string) || null,
      expiry_date: (formData.get('expiry_date') as string) || null,
      category: (formData.get('category') as string) || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) redirect(`/ingredients?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/ingredients')
  redirect('/ingredients')
}

export async function deleteIngredient(id: string) {
  const user = await getUser()
  const supabase = createClient()
  await supabase.from('ingredients').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/ingredients')
}

export async function toggleFavorite(id: string, current: boolean) {
  const user = await getUser()
  const supabase = createClient()
  await supabase
    .from('ingredients')
    .update({ is_favorite: !current })
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/ingredients')
}
