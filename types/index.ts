export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  user_id: string
  created_at: string
}

export interface Bid {
  id: string
  project_id: string
  user_id: string
  amount: number
  proposal: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'credit' | 'debit'
  description: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
