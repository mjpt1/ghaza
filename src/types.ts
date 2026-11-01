export type Role = 'admin' | 'accountant' | 'storekeeper' | 'employee'
export type PayMode = 'salary' | 'wallet'
export type PayPolicy = 'salary' | 'wallet' | 'choice'

export interface Employee {
  id: string
  code: string
  name: string
  department: string
  position: string
  payMode: PayMode
  wallet: number
  active: boolean
}

export interface RecipeLine { itemId: string; qty: number }

export interface Food {
  id: string
  code: string
  name: string
  category: string
  price: number
  emoji: string
  calories: number
  active: boolean
  recipe: RecipeLine[]
}

export interface MenuDay { date: string; foodIds: string[] }

export type OrderType = 'employee' | 'special'
export type OrderStatus = 'pending' | 'delivered' | 'cancelled'
export type OrderPay = 'salary' | 'wallet' | 'company'

export interface Order {
  id: string
  date: string
  type: OrderType
  employeeId: string | null
  foodId: string
  qty: number
  unitPrice: number
  companyShare: number // company subsidy per unit
  pay: OrderPay
  status: OrderStatus
  guestTitle?: string
  costCenter?: string
  note?: string
  createdAt: number
}

export interface InventoryItem {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
  unitCost: number
}

export interface StockMove {
  id: string
  itemId: string
  date: string
  qty: number // + in, - out
  reason: string
  createdAt: number
}

export interface WalletTx {
  id: string
  employeeId: string
  date: string
  amount: number // + charge, - spend
  note: string
  createdAt: number
}

export interface Settings {
  companyName: string
  unitName: string
  systemName: string
  subsidyPercent: number
  payPolicy: PayPolicy
  orderDeadlineHour: number
  maxPerDay: number
  allowNegativeWallet: boolean
}
