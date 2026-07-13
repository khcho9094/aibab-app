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

// ── 아이 프로필 ──────────────────────────────────────

export async function createChild(formData: FormData) {
  const user = await getUser()
  const supabase = createClient()

  const { error } = await supabase.from('children').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    birthdate: formData.get('birthdate') as string,
  })

  if (error) redirect(`/children/new?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/children')
  redirect('/children')
}

export async function updateChild(id: string, formData: FormData) {
  const user = await getUser()
  const supabase = createClient()

  const { error } = await supabase
    .from('children')
    .update({
      name: formData.get('name') as string,
      birthdate: formData.get('birthdate') as string,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) redirect(`/children/${id}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/children')
  revalidatePath(`/children/${id}`)
  redirect(`/children/${id}`)
}

export async function deleteChild(id: string) {
  const user = await getUser()
  const supabase = createClient()

  await supabase.from('children').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/children')
  redirect('/children')
}

// ── 알레르기 ─────────────────────────────────────────

export async function addAllergy(childId: string, formData: FormData) {
  const user = await getUser()
  const supabase = createClient()

  // childId 소유권 검증
  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('user_id', user.id)
    .single()
  if (!child) redirect('/children')

  await supabase.from('child_allergies').insert({
    child_id: childId,
    ingredient_name: formData.get('ingredient_name') as string,
    severity: formData.get('severity') as 'mild' | 'severe',
    note: (formData.get('note') as string) || null,
  })

  revalidatePath(`/children/${childId}`)
}

export async function deleteAllergy(allergyId: string, childId: string) {
  const user = await getUser()
  const supabase = createClient()

  // childId가 현재 user 소유인지 검증
  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('user_id', user.id)
    .single()
  if (!child) return

  await supabase
    .from('child_allergies')
    .delete()
    .eq('id', allergyId)
    .eq('child_id', childId)
  revalidatePath(`/children/${childId}`)
}
