export function calcAgeMonths(birthdate: string): number {
  const birth = new Date(birthdate)
  const now = new Date()
  return (
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  )
}

export function formatAgeLabel(months: number): string {
  if (months < 1) return '1개월 미만'
  if (months < 12) return `${months}개월`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0 ? `${years}세` : `${years}세 ${rem}개월`
}
