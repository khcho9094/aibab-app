export type Child = {
  id: string
  user_id: string
  name: string
  birthdate: string
  created_at: string
}

export type ChildAllergy = {
  id: string
  child_id: string
  ingredient_name: string
  severity: 'mild' | 'severe'
  note: string | null
  confirmed_at: string | null
  created_at: string
}

export type Ingredient = {
  id: string
  user_id: string
  name: string
  canonical_name: string | null
  quantity: number | null
  unit: string | null
  expiry_date: string | null
  category: string | null
  is_favorite: boolean
  created_at: string
}
