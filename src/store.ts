import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee, Food, InventoryItem, MenuDay, Order, OrderType, PayMode, Role, Settings, StockMove, WalletTx } from './types'
import { buildSeed, SIDE_CATEGORY } from './seed'
import { todayISO, uid } from './utils'

interface Data {
  employees: Employee[]
  foods: Food[]
  menus: MenuDay[]
  orders: Order[]
  inventory: InventoryItem[]
  stockMoves: StockMove[]
  walletTx: WalletTx[]
  settings: Settings
}

interface NewOrder {
  date: string
  type: OrderType
  employeeId: string | null
  foodId: string
  qty: number
  guestTitle?: string
  costCenter?: string
  note?: string
}

interface State extends Data {
  role: Role
  currentEmployeeId: string
  setRole: (r: Role) => void
  setCurrentEmployee: (id: string) => void

  upsertFood: (f: Food) => void
  toggleFood: (id: string) => void
  setMenu: (date: string, foodIds: string[]) => void
  copyMenu: (from: string, to: string) => void

  placeOrder: (o: NewOrder) => string | null
  cancelOrder: (id: string) => void
  deliverDay: (date: string) => { delivered: number; shortages: string[] }

  upsertEmployee: (e: Employee) => void
  chargeWallet: (employeeId: string, amount: number, note: string) => void

  upsertItem: (i: InventoryItem) => void
  stockMove: (itemId: string, qty: number, reason: string, unitCost?: number) => void

  updateSettings: (s: Partial<Settings>) => void
  resetDemo: () => void
}

export const effectivePayMode = (e: Employee, s: Settings): PayMode => (s.payPolicy === 'choice' ? e.payMode : s.payPolicy)

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      role: 'admin',
      currentEmployeeId: 'e1',
      setRole: role => set({ role }),
      setCurrentEmployee: currentEmployeeId => set({ currentEmployeeId }),

      upsertFood: f => set(s => ({ foods: s.foods.some(x => x.id === f.id) ? s.foods.map(x => (x.id === f.id ? f : x)) : [...s.foods, f] })),
      toggleFood: id => set(s => ({ foods: s.foods.map(f => (f.id === id ? { ...f, active: !f.active } : f)) })),

      setMenu: (date, foodIds) =>
        set(s => ({ menus: [...s.menus.filter(m => m.date !== date), ...(foodIds.length ? [{ date, foodIds }] : [])] })),
      copyMenu: (from, to) => {
        const m = get().menus.find(x => x.date === from)
        if (m) get().setMenu(to, [...m.foodIds])
      },

      placeOrder: o => {
        const s = get()
        const food = s.foods.find(f => f.id === o.foodId)
        if (!food) return 'غذا یافت نشد'
        if (o.qty <= 0) return 'تعداد نامعتبر است'
        const companyShare = o.type === 'special' ? food.price : Math.round((food.price * s.settings.subsidyPercent) / 100)
        let pay: Order['pay'] = 'company'
        let emp: Employee | undefined
        if (o.type === 'employee') {
          emp = s.employees.find(e => e.id === o.employeeId)
          if (!emp) return 'کارمند انتخاب نشده'
          if (food.category !== SIDE_CATEGORY) {
            const mainsToday = s.orders.filter(
              x => x.employeeId === emp!.id && x.date === o.date && x.status !== 'cancelled' &&
                s.foods.find(f => f.id === x.foodId)?.category !== SIDE_CATEGORY,
            ).reduce((a, x) => a + x.qty, 0)
            if (mainsToday + o.qty > s.settings.maxPerDay) return `حداکثر ${s.settings.maxPerDay.toLocaleString('fa-IR')} غذای اصلی در روز مجاز است`
          }
          pay = effectivePayMode(emp, s.settings)
          const cost = (food.price - companyShare) * o.qty
          if (pay === 'wallet' && !s.settings.allowNegativeWallet && emp.wallet < cost) return 'موجودی کیف پول کافی نیست'
        }
        const order: Order = {
          id: uid(), date: o.date, type: o.type, employeeId: o.employeeId, foodId: o.foodId, qty: o.qty,
          unitPrice: food.price, companyShare, pay, status: 'pending', guestTitle: o.guestTitle,
          costCenter: o.costCenter, note: o.note, createdAt: Date.now(),
        }
        const patch: Partial<Data> = { orders: [...s.orders, order] }
        if (emp && pay === 'wallet') {
          const cost = (food.price - companyShare) * o.qty
          patch.employees = s.employees.map(e => (e.id === emp!.id ? { ...e, wallet: e.wallet - cost } : e))
          patch.walletTx = [...s.walletTx, { id: uid(), employeeId: emp.id, date: todayISO(), amount: -cost, note: `سفارش ${food.name}`, createdAt: Date.now() }]
        }
        set(patch)
        return null
      },

      cancelOrder: id => {
        const s = get()
        const o = s.orders.find(x => x.id === id)
        if (!o || o.status !== 'pending') return
        const patch: Partial<Data> = { orders: s.orders.map(x => (x.id === id ? { ...x, status: 'cancelled' } : x)) }
        if (o.pay === 'wallet' && o.employeeId) {
          const refund = (o.unitPrice - o.companyShare) * o.qty
          const food = s.foods.find(f => f.id === o.foodId)
          patch.employees = s.employees.map(e => (e.id === o.employeeId ? { ...e, wallet: e.wallet + refund } : e))
          patch.walletTx = [...s.walletTx, { id: uid(), employeeId: o.employeeId, date: todayISO(), amount: refund, note: `لغو سفارش ${food?.name ?? ''}`, createdAt: Date.now() }]
        }
        set(patch)
      },

      deliverDay: date => {
        const s = get()
        const pending = s.orders.filter(o => o.date === date && o.status === 'pending')
        const need: Record<string, number> = {}
        for (const o of pending) {
          const f = s.foods.find(x => x.id === o.foodId)
          f?.recipe.forEach(r => (need[r.itemId] = (need[r.itemId] ?? 0) + r.qty * o.qty))
        }
        const shortages: string[] = []
        const now = Date.now()
        const moves: StockMove[] = []
        const inventory = s.inventory.map(i => {
          const q = need[i.id]
          if (!q) return i
          if (q > i.stock) shortages.push(i.name)
          moves.push({ id: uid(), itemId: i.id, date, qty: -q, reason: 'مصرف آشپزخانه (تحویل سفارش‌ها)', createdAt: now })
          return { ...i, stock: Math.max(0, +(i.stock - q).toFixed(3)) }
        })
        const ids = new Set(pending.map(o => o.id))
        set({
          inventory,
          stockMoves: [...s.stockMoves, ...moves],
          orders: s.orders.map(o => (ids.has(o.id) ? { ...o, status: 'delivered' } : o)),
        })
        return { delivered: pending.length, shortages }
      },

      upsertEmployee: e => set(s => ({ employees: s.employees.some(x => x.id === e.id) ? s.employees.map(x => (x.id === e.id ? e : x)) : [...s.employees, e] })),

      chargeWallet: (employeeId, amount, note) =>
        set(s => ({
          employees: s.employees.map(e => (e.id === employeeId ? { ...e, wallet: e.wallet + amount } : e)),
          walletTx: [...s.walletTx, { id: uid(), employeeId, date: todayISO(), amount, note, createdAt: Date.now() }],
        })),

      upsertItem: i => set(s => ({ inventory: s.inventory.some(x => x.id === i.id) ? s.inventory.map(x => (x.id === i.id ? i : x)) : [...s.inventory, i] })),

      stockMove: (itemId, qty, reason, unitCost) =>
        set(s => ({
          inventory: s.inventory.map(i => (i.id === itemId ? { ...i, stock: Math.max(0, +(i.stock + qty).toFixed(3)), unitCost: unitCost ?? i.unitCost } : i)),
          stockMoves: [...s.stockMoves, { id: uid(), itemId, date: todayISO(), qty, reason, createdAt: Date.now() }],
        })),

      updateSettings: p => set(s => ({ settings: { ...s.settings, ...p } })),
      resetDemo: () => set({ ...buildSeed(), role: 'admin', currentEmployeeId: 'e1' }),
    }),
    { name: 'food-ordering-demo-v1' },
  ),
)

/** Lookup helpers */
export const useMaps = () => {
  const foods = useStore(s => s.foods)
  const employees = useStore(s => s.employees)
  return {
    food: (id: string) => foods.find(f => f.id === id),
    emp: (id: string | null) => (id ? employees.find(e => e.id === id) : undefined),
  }
}
