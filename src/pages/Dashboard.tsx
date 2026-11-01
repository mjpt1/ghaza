import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { Card, PageHeader, Stat } from '../components/ui'
import { addDays, faDate, faDay, jalaliMonthKey, money, num, todayISO } from '../utils'

export const COLORS = ['#ea580c', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b', '#84cc16']

export default function Dashboard() {
  const { orders, foods, employees, inventory, settings } = useStore()
  const today = todayISO()
  const month = jalaliMonthKey(today)
  const live = orders.filter(o => o.status !== 'cancelled')
  const todays = live.filter(o => o.date === today)
  const monthOrders = live.filter(o => jalaliMonthKey(o.date) === month)
  const total = (os: typeof live) => os.reduce((a, o) => a + o.unitPrice * o.qty, 0)
  const subsidy = monthOrders.reduce((a, o) => a + o.companyShare * o.qty, 0)
  const activeEmp = employees.filter(e => e.active).length
  const orderedToday = new Set(todays.filter(o => o.employeeId).map(o => o.employeeId)).size
  const low = inventory.filter(i => i.stock <= i.minStock)

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
  const trend = days.map(d => {
    const os = live.filter(o => o.date === d)
    return { name: faDate(d).slice(5), count: os.reduce((a, o) => a + o.qty, 0), amount: total(os) / 1_000_000 }
  })

  const byFood = Object.entries(
    monthOrders.reduce<Record<string, number>>((a, o) => ((a[o.foodId] = (a[o.foodId] ?? 0) + o.qty), a), {}),
  )
    .map(([id, qty]) => ({ name: foods.find(f => f.id === id)?.name ?? '?', qty }))
    .sort((a, b) => b.qty - a.qty)
  const pie = [...byFood.slice(0, 6), ...(byFood.length > 6 ? [{ name: 'سایر', qty: byFood.slice(6).reduce((a, x) => a + x.qty, 0) }] : [])]

  const byDept = Object.entries(
    monthOrders.reduce<Record<string, number>>((a, o) => {
      const d = o.type === 'special' ? 'سفارش ویژه' : employees.find(e => e.id === o.employeeId)?.department ?? '?'
      a[d] = (a[d] ?? 0) + o.unitPrice * o.qty
      return a
    }, {}),
  ).map(([name, v]) => ({ name, value: Math.round(v / 1_000_000) })).sort((a, b) => b.value - a.value)

  return (
    <>
      <PageHeader title={settings.systemName} subtitle={`${settings.companyName} — ${settings.unitName}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="🍽️" label="سفارش‌های امروز" value={num(todays.reduce((a, o) => a + o.qty, 0))} hint={`${num(orderedToday)} از ${num(activeEmp)} نفر سفارش داده‌اند`} />
        <Stat icon="💳" tone="blue" label="فروش ماه جاری" value={money(total(monthOrders))} hint={`${num(monthOrders.length)} قلم سفارش`} />
        <Stat icon="🏢" tone="green" label="سهم یارانه شرکت (ماه)" value={money(subsidy)} hint={`${num(settings.subsidyPercent)}٪ یارانه`} />
        <Stat icon="⚠️" tone={low.length ? 'red' : 'green'} label="اقلام زیر حد انبار" value={num(low.length)} hint={low.slice(0, 2).map(i => i.name).join('، ') || 'همه کافی'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="روند سفارش ۱۴ روز اخیر" className="xl:col-span-2">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ea580c" stopOpacity={0.35} />
                    <stop offset="1" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed />
                <YAxis tick={{ fontSize: 11 }} orientation="right" />
                <Tooltip formatter={(v: number) => [num(v), 'تعداد']} />
                <Area type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="محبوب‌ترین غذاهای ماه">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="qty" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => num(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {pie.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {p.name} <span className="text-slate-400">({num(p.qty)})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="هزینه غذا به تفکیک واحد (میلیون ریال)" className="xl:col-span-2">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={byDept} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} reversed />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} orientation="right" />
                <Tooltip formatter={(v: number) => num(v)} />
                <Bar dataKey="value" fill="#f59e0b" radius={[6, 0, 0, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={`امروز — ${faDay(today)}`}>
          <TodaySummary />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['/order', '🍽️', 'سفارش کارکنان'],
          ['/menu', '📅', 'برنامه غذایی'],
          ['/kitchen', '👨‍🍳', 'آشپزخانه'],
          ['/accounting', '💰', 'حسابداری'],
        ].map(([to, icon, label]) => (
          <Link key={to} to={to} className="group rounded-2xl border-t-4 border-brand-500 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-3xl transition group-hover:scale-110">{icon}</div>
            <div className="mt-2 text-sm font-bold">{label}</div>
          </Link>
        ))}
      </div>
    </>
  )
}

function TodaySummary() {
  const { orders, foods } = useStore()
  const today = todayISO()
  const rows = Object.entries(
    orders.filter(o => o.date === today && o.status !== 'cancelled').reduce<Record<string, number>>((a, o) => ((a[o.foodId] = (a[o.foodId] ?? 0) + o.qty), a), {}),
  ).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...rows.map(r => r[1]))
  if (!rows.length) return <div className="py-10 text-center text-sm text-slate-400">امروز سفارشی ثبت نشده</div>
  return (
    <div className="space-y-3">
      {rows.map(([id, q]) => {
        const f = foods.find(x => x.id === id)
        return (
          <div key={id}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{f?.emoji} {f?.name}</span>
              <b>{num(q)}</b>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-gradient-to-l from-brand-500 to-amber-400" style={{ width: `${(q / max) * 100}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
