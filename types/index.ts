export type UserRole = 'cliente' | 'arquiteto' | 'fornecedor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: Date
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'draft' | 'in_progress' | 'review' | 'completed'
  clientId: string
  arquitetoId: string
  budget: number
  createdAt: Date
  updatedAt: Date
}

export interface Quote {
  id: string
  projectId: string
  fornecedorId: string
  items: QuoteItem[]
  total: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  fornecedorId: string
  images: string[]
  inStock: boolean
}
