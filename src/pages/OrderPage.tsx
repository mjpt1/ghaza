import { useMemo, useState } from 'react'
import { effectivePayMode, useStore } from '../store'
import { Badge, Button, Card, Empty, PageHeader, toast } from '../components/ui'
import { addDays, faDate, faDay, isFriday, money, num, todayISO } from '../utils'
import { SIDE_CATEGORY } from '../seed'

export default function OrderPage() {
  const s = useStore()
  const { role, employees, menus, foods, orders, settings, placeOrder, cancelOrder } = s
  const isAdmin = role === 'admin'
  const [pickedEmp, setPickedEmp] = useState(employees[0]?.id ?? '')
  const [q, setQ] = useState('')
  const empId = isAdmin ? pickedEmp : s.currentEmployeeId
  const emp = employees.find(e => e.id === empId)

  const today = todayISO()
  const days = useMemo(() => {
    const out: string[] = []
    for (let i = 0; out.length < 6; i++) {
      const d = addDays(today, i)
      if (!isFriday(d)) out.push(d)
    }
    return out
  }, [today])
  const [day, setDay] = useState(days[0])

  const closed = (d: string) => d < today || (d === today && new Date().getHours() >= settings.orderDeadlineHour)
  const isClosed = closed(day) && !isAdmin
  const menu = menus.find(m => m.date === day)
  const menuFoods = (menu?.foodIds ?? []).map(id => foods.find(f => f.id === id)).filter(f => f && f.active) as typeof foods
  const mains = menuFoods.filter(f => f.category !== SIDE_CATEGORY)
  const sides = menuFoods.filter(f => f.category === SIDE_CATEGORY)
  const myOrders = orders.filter(o => o.employeeId === empId && o.date === day && o.status !== 'cancelled')
  const share = (p: number) => p - Math.round((p * settings.subsidyPercent) / 100)
  const payMode = emp ? effectivePayMode(emp, settings) : 'salary'

  const order = (foodId: string) => {
    const err = placeOrder({ date: day, type: 'employee', employeeId: empId, foodId, qty: 1 })
    err ? toast(err, 'err') : toast('سفارش ثبت شد ✓')
  }

  const filteredEmps = employees.filter(e => e.active && (e.name.includes(q) || e.code.includes(q)))

  return (
    <>
      <PageHeader title="سفارش غذای کارکنان" subtitle={`مهلت ثبت سفارش هر روز تا ساعت ${num(settings.orderDeadlineHour)}:۰۰ صبح`} />

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-1">
          {isAdmin && (
            <Card title="انتخاب کارمند">
              <input className="input mb-2" placeholder="جستجو نام یا کد پرسنلی…" value={q} onChange={e => setQ(e.target.value)} />
              <div className="max-h-72 space-y-1 overflow-auto">
                {filteredEmps.map(e => (
                  <button key={e.id} onClick={() => setPickedEmp(e.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm ${e.id === empId ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-50'}`}>
                    <span>{e.name}</span>
                    <span className="text-xs text-slate-400">{e.code}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
          {emp && (
            <Card title="اطلاعات کارمند">
              <div className="space-y-2 text-sm">
                <Row k="نام" v={emp.name} />
                <Row k="کد پرسنلی" v={emp.code} />
                <Row k="واحد" v={emp.department} />
                <Row k="روش پرداخت" v={payMode === 'wallet' ? <Badge color="violet">کیف پول</Badge> : <Badge color="blue">کسر از حقوق</Badge>} />
                {payMode === 'wallet' && <Row k="موجودی کیف پول" v={<b className={emp.wallet < 0 ? 'text-rose-600' : 'text-emerald-600'}>{money(emp.wallet)}</b>} />}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6 xl:col-span-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {days.map(d => {
              const has = orders.some(o => o.employeeId === empId && o.date === d && o.status !== 'cancelled')
              return (
                <button key={d} onClick={() => setDay(d)} className={`relative rounded-xl border p-3 text-center transition ${d === day ? 'border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                  <div className="text-xs opacity-80">{d === today ? 'امروز' : faDay(d)}</div>
                  <div className="font-bold">{faDate(d).slice(5)}</div>
                  {has && <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />}
                </button>
              )
            })}
          </div>

          {isClosed && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">⏰ مهلت ثبت سفارش برای این روز به پایان رسیده است.</div>}

          <Card title={`منوی ${faDay(day)} ${faDate(day)}`}>
            {!mains.length ? (
              <Empty text="برای این روز برنامه غذایی ثبت نشده است" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mains.map(f => {
                  const mine = myOrders.find(o => o.foodId === f.id)
                  return (
                    <div key={f.id} className={`rounded-2xl border p-4 transition ${mine ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-brand-300 hover:shadow-md'}`}>
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{f.emoji}</div>
                        <Badge>{f.category}</Badge>
                      </div>
                      <div className="mt-3 font-bold">{f.name}</div>
                      <div className="text-xs text-slate-400">{num(f.calories)} کالری</div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-400 line-through">{money(f.price)}</div>
                          <div className="text-sm font-bold text-brand-700">{money(share(f.price))}</div>
                        </div>
                        {mine ? <Badge color="green">✓ سفارش داده شد</Badge> : <Button size="sm" disabled={isClosed} onClick={() => order(f.id)}>سفارش</Button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {sides.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-2 text-sm font-semibold text-slate-500">مخلفات</div>
                <div className="flex flex-wrap gap-2">
                  {sides.map(f => (
                    <button key={f.id} disabled={isClosed} onClick={() => order(f.id)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-brand-400 disabled:opacity-50">
                      {f.emoji} {f.name} <span className="text-xs text-slate-400">{money(share(f.price))}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="سفارش‌های این روز">
            {!myOrders.length ? (
              <Empty text="سفارشی ثبت نشده" />
            ) : (
              <div className="divide-y divide-slate-100">
                {myOrders.map(o => {
                  const f = foods.find(x => x.id === o.foodId)
                  return (
                    <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span>{f?.emoji} {f?.name} × {num(o.qty)}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{money((o.unitPrice - o.companyShare) * o.qty)}</span>
                        {o.status === 'delivered' ? <Badge color="green">تحویل شده</Badge> : <Button size="sm" variant="danger" disabled={isClosed} onClick={() => { cancelOrder(o.id); toast('سفارش لغو شد') }}>لغو</Button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-slate-500">{k}</span>
    <span>{v}</span>
  </div>
)
