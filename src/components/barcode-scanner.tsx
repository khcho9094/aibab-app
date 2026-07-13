'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface ScanResult {
  name: string
  barcode: string
}

interface Props {
  onScan: (result: ScanResult) => void
}

export default function BarcodeScanner({ onScan }: Props) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const divId = 'barcode-scanner-region'

  async function startScan() {
    setError(null)
    setScanning(true)

    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      const scanner = new Html5QrcodeScanner(
        divId,
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      )

      scanner.render(
        async (decodedText) => {
          await scanner.clear()
          setScanning(false)

          // 식품안전나라 API 조회
          try {
            const res = await fetch(`/api/barcode?barcode=${decodedText}`)
            const data = await res.json()
            onScan({ name: data.name || '', barcode: decodedText })
          } catch {
            onScan({ name: '', barcode: decodedText })
          }
        },
        () => {} // 오류 무시 (스캔 중 일시적 오류)
      )

      // 타입 단언으로 stop 메서드 저장
      scannerRef.current = { stop: () => scanner.clear() }
    } catch {
      setError('카메라를 사용할 수 없습니다')
      setScanning(false)
    }
  }

  function stopScan() {
    scannerRef.current?.stop()
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop()
    }
  }, [])

  return (
    <div className="space-y-3">
      {!scanning ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={startScan}
        >
          📷 바코드 스캔
        </Button>
      ) : (
        <div className="space-y-2">
          <div id={divId} className="rounded-lg overflow-hidden" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={stopScan}
          >
            취소
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
