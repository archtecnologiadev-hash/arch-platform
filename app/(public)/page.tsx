import { redirect } from 'next/navigation'

// Root (/) is handled by app/page.tsx — this avoids route conflict
export default function PublicPage() {
  redirect('/')
}
