import { UserRole } from '@/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  arquiteto: 'Arquiteto',
  fornecedor: 'Fornecedor',
}

export const ROLE_ROUTES: Record<UserRole, string> = {
  cliente: '/dashboard',
  arquiteto: '/dashboard',
  fornecedor: '/dashboard',
}

export const PROJECT_STATUS_LABELS = {
  draft: 'Rascunho',
  in_progress: 'Em andamento',
  review: 'Em revisão',
  completed: 'Concluído',
} as const

export const PROJECT_STATUS_COLORS = {
  draft: 'secondary',
  in_progress: 'default',
  review: 'outline',
  completed: 'success',
} as const
