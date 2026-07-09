'use client'

import { useState } from 'react'
import { createIngredient } from '@/lib/actions/ingredients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BarcodeScanner from '@/components/barcode-scanner'

const CATEGORIES = ['채소', '과일', '육류', '어류', '유제품', '곡물', '기타']

export default function IngredientForm({ error }: { error?: string }) {
  const [name, setName] = useState('')

  function handleScan({ name: scannedName }: { name: string; barcode: string }) {
    if (scannedName) setName(scannedName)
  }

  return (
    <form action={createIngredient} className="space-y-5">
      {/* 바코드 스캔 */}
      <BarcodeScanner onScan={handleScan} />

      <div className="space-y-1.5">
        <Label htmlFor="name">재료명 *</Label>
        <Input
          id="name"
          name="name"
          placeholder="예: 당근"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-3">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="quantity">수량</Label>
          <Input id="quantity" name="quantity" type="number" min="0" step="0.1" placeholder="1" />
        </div>
        <div className="space-y-1.5 w-24">
          <Label htmlFor="unit">단위</Label>
          <Input id="unit" name="unit" placeholder="개, g, ml" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expiry_date">유통기한</Label>
        <Input id="expiry_date" name="expiry_date" type="date" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          name="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
        저장하기
      </Button>
    </form>
  )
}
