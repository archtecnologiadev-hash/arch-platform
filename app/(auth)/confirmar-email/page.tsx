'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'

function Redirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/confirmar-email/codigo')
  }, [router])
  return null
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  )
}
