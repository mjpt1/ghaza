import type { Employee, Food, InventoryItem, MenuDay, Order, Settings, StockMove, WalletTx } from './types'
import { addDays, isFriday, rng, todayISO } from './utils'

export const SIDE_CATEGORY = 'مخلفات'

export const defaultSettings: Settings = {
  companyName: 'شرکت فولاد خوزستان',
  unitName: 'مدیریت ساختمان مرکزی',
  systemName: 'سامانه هوشمند سفارش غذای کارکنان',
  subsidyPercent: 50,
  payPolicy: 'choice',
  orderDeadlineHour: 10,
  maxPerDay: 1,
  allowNegativeWallet: false,
}

const items: [string, string, string, number, number, number][] = [
  // id, name, unit, stock, min, unit cost (rial)
  ['rice', 'برنج ایرانی', 'کیلوگرم', 180, 40, 1_100_000],
  ['lamb', 'گوشت گوسفندی', 'کیلوگرم', 45, 15, 7_500_000],
  ['mince', 'گوشت چرخ‌کرده', 'کیلوگرم', 30, 10, 5_800_000],
  ['chicken', 'مرغ', 'کیلوگرم', 60, 20, 1_300_000],
  ['fish', 'ماهی قزل‌آلا', 'کیلوگرم', 8, 10, 2_900_000],
  ['split', 'لپه', 'کیلوگرم', 20, 5, 900_000],
  ['herbs', 'سبزی قورمه', 'کیلوگرم', 12, 5, 800_000],
  ['beans', 'لوبیا قرمز', 'کیلوگرم', 15, 5, 1_000_000],
  ['lentil', 'عدس', 'کیلوگرم', 14, 5, 850_000],
  ['potato', 'سیب‌زمینی', 'کیلوگرم', 40, 15, 250_000],
  ['onion', 'پیاز', 'کیلوگرم', 35, 10, 200_000],
  ['paste', 'رب گوجه', 'کیلوگرم', 10, 4, 600_000],
  ['oil', 'روغن', 'لیتر', 25, 8, 900_000],
  ['pasta', 'ماکارونی', 'کیلوگرم', 18, 6, 450_000],
  ['eggplant', 'بادمجان', 'کیلوگرم', 6, 8, 300_000],
  ['barberry', 'زرشک', 'کیلوگرم', 3, 1, 3_000_000],
  ['lettuce', 'کاهو و سبزیجات سالاد', 'کیلوگرم', 10, 4, 350_000],
  ['doogh', 'دوغ', 'عدد', 120, 40, 70_000],
  ['yogurt', 'ماست', 'عدد', 90, 30, 60_000],
  ['soda', 'نوشابه', 'عدد', 70, 30, 90_000],
  ['bread', 'نان', 'عدد', 150, 50, 30_000],
]

const foods: [string, string, string, number, string, number, [string, number][]][] = [
  ['F001', 'کباب کوبیده', 'کبابی', 1_000_000, '🍢', 750, [['rice', 0.15], ['mince', 0.18], ['onion', 0.03], ['oil', 0.01]]],
  ['F002', 'جوجه کباب', 'کبابی', 1_250_000, '🍗', 680, [['rice', 0.15], ['chicken', 0.25], ['onion', 0.02], ['oil', 0.01]]],
  ['F003', 'چلوخورشت قیمه', 'خورشتی', 1_450_000, '🍛', 720, [['rice', 0.15], ['lamb', 0.08], ['split', 0.04], ['potato', 0.08], ['paste', 0.02], ['oil', 0.02]]],
  ['F004', 'قورمه سبزی', 'خورشتی', 1_300_000, '🥘', 690, [['rice', 0.15], ['lamb', 0.08], ['herbs', 0.06], ['beans', 0.03], ['oil', 0.02]]],
  ['F005', 'پلو عدس', 'پلو', 950_000, '🍚', 610, [['rice', 0.15], ['lentil', 0.05], ['onion', 0.03], ['oil', 0.02]]],
  ['F006', 'خوراک سینه مرغ رژیمی', 'رژیمی', 980_000, '🥗', 420, [['chicken', 0.2], ['lettuce', 0.08], ['potato', 0.05]]],
  ['F007', 'قیمه امام حسینی', 'خورشتی', 700_000, '🍲', 650, [['rice', 0.12], ['lamb', 0.05], ['split', 0.04], ['paste', 0.02]]],
  ['F008', 'زرشک پلو با مرغ', 'پلو', 1_150_000, '🍽️', 700, [['rice', 0.15], ['chicken', 0.25], ['barberry', 0.01], ['oil', 0.01]]],
  ['F009', 'چلو ماهی', 'دریایی', 1_400_000, '🐟', 560, [['rice', 0.15], ['fish', 0.25], ['oil', 0.02]]],
  ['F010', 'ماکارونی', 'فست‌فود', 750_000, '🍝', 640, [['pasta', 0.15], ['mince', 0.06], ['paste', 0.03], ['oil', 0.01]]],
  ['F011', 'کشک بادمجان', 'سنتی', 650_000, '🍆', 480, [['eggplant', 0.3], ['onion', 0.04], ['oil', 0.03], ['bread', 1]]],
  ['F012', 'سالاد سزار', 'رژیمی', 850_000, '🥬', 390, [['lettuce', 0.2], ['chicken', 0.1], ['bread', 1]]],
  ['S001', 'دوغ', SIDE_CATEGORY, 120_000, '🥛', 80, [['doogh', 1]]],
  ['S002', 'ماست', SIDE_CATEGORY, 100_000, '🥣', 90, [['yogurt', 1]]],
  ['S003', 'نوشابه', SIDE_CATEGORY, 150_000, '🥤', 140, [['soda', 1]]],
]

const firstNames = ['علی', 'محمد', 'رضا', 'حسین', 'مهدی', 'زهرا', 'فاطمه', 'مریم', 'سارا', 'نرگس', 'امیر', 'حمید', 'سعید', 'مجید', 'الهام', 'لیلا', 'پریسا', 'کاوه', 'بهرام', 'نازنین', 'یاسر', 'مصطفی', 'سمیرا', 'آرش', 'فرزانه']
const lastNames = ['احمدی', 'محمدی', 'کریمی', 'حسینی', 'رضایی', 'موسوی', 'جعفری', 'نوری', 'صادقی', 'عباسی', 'طاهری', 'بهرامی', 'کاظمی', 'شریفی', 'زارعی', 'قاسمی', 'مرادی', 'فرهادی', 'سلیمانی', 'باقری', 'نجفی', 'یوسفی', 'اکبری', 'رحیمی', 'دهقان']
const departments: [string, string[]][] = [
  ['مدیریت', ['مدیر', 'معاون', 'دستیار مدیر']],
  ['مالی و حسابداری', ['حسابدار', 'کارشناس مالی', 'ممیز']],
  ['منابع انسانی', ['کارشناس منابع انسانی', 'کارشناس آموزش']],
  ['فناوری اطلاعات', ['برنامه‌نویس', 'کارشناس شبکه', 'پشتیبان']],
  ['بازرگانی', ['کارشناس خرید', 'کارشناس فروش']],
  ['خدمات و پشتیبانی', ['تکنسین', 'راننده', 'نگهبان']],
  ['حقوقی', ['کارشناس حقوقی']],
]

export function buildSeed() {
  const r = rng(42)
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const today = todayISO()

  const inventory: InventoryItem[] = items.map(([id, name, unit, stock, minStock, unitCost]) => ({ id, name, unit, stock, minStock, unitCost }))

  const foodList: Food[] = foods.map(([code, name, category, price, emoji, calories, recipe]) => ({
    id: code.toLowerCase(), code, name, category, price, emoji, calories, active: true,
    recipe: recipe.map(([itemId, qty]) => ({ itemId, qty })),
  }))

  const used = new Set<string>()
  const employees: Employee[] = Array.from({ length: 50 }, (_, i) => {
    let name = ''
    do { name = `${pick(firstNames)} ${pick(lastNames)}` } while (used.has(name))
    used.add(name)
    const [department, positions] = i < 3 ? departments[0] : pick(departments.slice(1))
    return {
      id: `e${i + 1}`,
      code: String(1001 + i),
      name,
      department,
      position: pick(positions),
      payMode: r() < 0.6 ? 'salary' : 'wallet',
      wallet: 0,
      active: true,
    }
  })

  const mains = foodList.filter(f => f.category !== SIDE_CATEGORY)
  const sides = foodList.filter(f => f.category === SIDE_CATEGORY)

  // menus: 30 days back to 7 days ahead, no Fridays
  const menus: MenuDay[] = []
  for (let d = -30; d <= 7; d++) {
    const date = addDays(today, d)
    if (isFriday(date)) continue
    const shuffled = [...mains].sort(() => r() - 0.5).slice(0, 4 + Math.floor(r() * 2))
    menus.push({ date, foodIds: [...shuffled.map(f => f.id), ...sides.map(s => s.id)] })
  }

  const orders: Order[] = []
  const walletTx: WalletTx[] = []
  const share = (p: number) => Math.round((p * defaultSettings.subsidyPercent) / 100)

  // initial wallet charge
  employees.filter(e => e.payMode === 'wallet').forEach(e => {
    const amount = 30_000_000
    e.wallet += amount
    walletTx.push({ id: `w-${e.id}-init`, employeeId: e.id, date: addDays(today, -31), amount, note: 'شارژ اولیه', createdAt: 0 })
  })

  let n = 0
  for (const m of menus) {
    if (m.date > today) continue
    const dayMains = mains.filter(f => m.foodIds.includes(f.id))
    // weight popular foods
    const weighted = dayMains.flatMap(f => (['F001', 'F002', 'F004'].includes(f.code) ? [f, f, f] : [f]))
    for (const e of employees) {
      if (r() > 0.86) continue
      const lines: Food[] = [pick(weighted)]
      if (r() < 0.4) lines.push(pick(sides))
      for (const f of lines) {
        const cs = share(f.price)
        const o: Order = {
          id: `o${++n}`, date: m.date, type: 'employee', employeeId: e.id, foodId: f.id, qty: 1,
          unitPrice: f.price, companyShare: cs, pay: e.payMode, status: m.date < today ? 'delivered' : 'pending',
          createdAt: new Date(m.date + 'T08:00:00').getTime() + n,
        }
        orders.push(o)
        if (e.payMode === 'wallet') {
          const cost = f.price - cs
          e.wallet -= cost
          walletTx.push({ id: `w-${o.id}`, employeeId: e.id, date: m.date, amount: -cost, note: `سفارش ${f.name}`, createdAt: o.createdAt })
        }
      }
    }
    // occasional special orders (meetings / guests)
    if (r() < 0.3) {
      const f = pick(dayMains)
      orders.push({
        id: `o${++n}`, date: m.date, type: 'special', employeeId: null, foodId: f.id, qty: 5 + Math.floor(r() * 15),
        unitPrice: f.price, companyShare: f.price, pay: 'company', status: m.date < today ? 'delivered' : 'pending',
        guestTitle: pick(['جلسه هیئت مدیره', 'مهمانان شرکت همکار', 'بازدید وزارتخانه', 'جلسه کمیته فنی', 'آموزش کارکنان']),
        costCenter: pick(['مدیریت', 'بازرگانی', 'منابع انسانی']), createdAt: new Date(m.date + 'T09:00:00').getTime() + n,
      })
    }
  }

  const stockMoves: StockMove[] = inventory.map(i => ({
    id: `m-${i.id}`, itemId: i.id, date: addDays(today, -1), qty: i.stock, reason: 'موجودی اول دوره', createdAt: 0,
  }))

  return { employees, foods: foodList, menus, orders, inventory, stockMoves, walletTx, settings: { ...defaultSettings } }
}
