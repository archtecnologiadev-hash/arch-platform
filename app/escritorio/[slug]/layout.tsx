import type { Metadata } from 'next'

interface StudioMeta {
  nome: string
  cidade: string | null
  estado: string | null
  bio: string | null
  cover_url: string | null
  image_url: string | null
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/escritorios?slug=eq.${encodeURIComponent(params.slug)}&select=nome,cidade,estado,bio,cover_url,image_url&limit=1`,
      {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 3600 },
      }
    )
    const rows: StudioMeta[] = await res.json()
    const studio = rows[0]
    if (!studio) return { title: 'Escritório' }

    const location = [studio.cidade, studio.estado].filter(Boolean).join(', ')
    const title = location
      ? `${studio.nome} — Arquitetura em ${location}`
      : studio.nome

    const rawBio = studio.bio ?? ''
    const description = rawBio
      ? rawBio.slice(0, 155) + (rawBio.length > 155 ? '…' : '')
      : `Conheça o portfólio e entre em contato com ${studio.nome} na plataforma ARC.`

    const heroImage = studio.cover_url ?? studio.image_url ?? null

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        ...(heroImage
          ? { images: [{ url: heroImage, width: 1080, height: 1350 }] }
          : {}),
      },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    return { title: 'Escritório' }
  }
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
