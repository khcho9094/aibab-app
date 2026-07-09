import { NextRequest, NextResponse } from 'next/server'

// 식품안전나라 바코드 조회 API
// https://www.foodsafetykorea.go.kr/api/openApiInfo.do
export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')
  if (!barcode) {
    return NextResponse.json({ error: '바코드가 없습니다' }, { status: 400 })
  }

  try {
    const apiKey = process.env.FOOD_SAFETY_API_KEY
    if (!apiKey) {
      // API 키가 없으면 바코드 번호만 반환 (이름 수동 입력)
      return NextResponse.json({ name: '', barcode })
    }

    const url = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/I2570/json/1/1/BRCD_NO=${barcode}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const json = await res.json()

    const item = json?.I2570?.row?.[0]
    if (!item) {
      return NextResponse.json({ name: '', barcode })
    }

    return NextResponse.json({
      name: item.PRDLST_NM ?? '',
      barcode,
      manufacturer: item.BSSH_NM ?? '',
    })
  } catch {
    return NextResponse.json({ name: '', barcode })
  }
}
