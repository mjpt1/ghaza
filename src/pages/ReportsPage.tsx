import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { Badge, Button, Card, PageHeader, Stat, TableWrap } from '../components/ui'
import { addDays, downloadCSV, faDate, faDay, money, num, todayISO } from '../utils'

type Tab = 'food' | 'employee' | 'dept' | 'weekday' | 'detail'

export default function ReportsPage() {
  const { orders, foods, employees } = useStore()
  const [from, setFrom] = useState(addDays(todayISO(), -30))
  const [to, setTo] = useState(todayISO())
  const [tab, setTab] = useState<Tab>('food')
  const [empFilter, setEmpFilter] = useState('')
  const [foodFilter, setFoodFilter] = useState('')

  const os = orders.filter(o => o.status !== 'cancelled' && o.date >= from && o.date <= to && (!empFilter || o.employeeId === empFilter) && (!foodFilter || o.foodId === foodFilter))
  const total = os.reduce((a, o) => a + o.unitPrice * o.qty, 0)
  const qty = os.reduce((a, o) => a + o.qty, 0)
  const empName = (id: string | null) => employees.find(e => e.id === id)
  const foodName = (id: string) => foods.find(f => f.id === id)

  const group = (key: (o: (typeof os)[0]) => string) => {
    const m: Record<string, { qty: number; amount: number; people: Set<string> }> = {}
    os.forEach(o => {
      const k = key(o)
      m[k] ??= { qty: 0, amount: 0, people: new Set() }
      m[k].qty += o.qty
      m[k].amount += o.unitPrice * o.qty
      if (o.employeeId) m[k].people.add(o.employeeId)
    })
    return Object.entries(m).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.qty - a.qty)
  }

  const byFood = group(o => foodName(o.foodId)?.name ?? '?')
  const byEmp = group(o => (o.employeeId ? `${empName(o.employeeId)?.name} (${empName(o.employeeId)?.code})` : '⭐ سفارش ویژه'))
  const byDept = group(o => (o.type === 'special' ? 'سفارش ویژه' : empName(o.employeeId)?.department ?? '?'))
  const byWeekday = group(o => faDay(o.date))

  const rows = { food: byFood, employee: byEmp, dept: byDept, weekday: byWeekday }[tab as Exclude<Tab, 'detail'>] ?? []
  const title = { food: 'غذا', employee: 'کارمند', dept: 'واحد', weekday: 'روز هفته', detail: '' }[tab]

  const exportCSV = () => {
    if (tab === 'detail') {
      downloadCSV('orders-detail.csv', [['تاریخ', 'کد پرسنلی', 'نام', 'واحد', 'غذا', 'تعداد', 'مبلغ', 'سهم شرکت', 'روش پرداخت', 'وضعیت'], ...os.map(o => {
        const e = empName(o.employeeId)
        return [faDate(o.date), e?.code ?? '-', e?.name ?? o.guestTitle ?? '', e?.department ?? o.costCenter ?? '', foodName(o.foodId)?.name ?? '', o.qty, o.unitPrice * o.qty, o.companyShare * o.qty, o.pay, o.status]
      })])
    } else downloadCSV(`report-${tab}.csv`, [[title, 'تعداد', 'مبلغ', 'تعداد نفرات'], ...rows.map(r => [r.k, r.qty, r.amount, r.people.size])])
  }

  return (
    <>
      <PageHeader title="گزارش‌ها و آمار" subtitle="چه غذایی، چه کسی، چه زمانی — با فیلتر بازه زمانی">
        <Button variant="ghost" onClick={exportCSV}>⬇ خروجی اکسل</Button>
        <Button variant="ghost" onClick={() => window.print()}>🖨️ چاپ</Button>
      </PageHeader>

      <Card className="no-print mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label><span className="label">از تاریخ</span><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label><span className="label">تا تاریخ</span><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></label>
          <label><span className="label">کارمند</span>
            <select className="input" value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
              <option value="">همه</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <label><span className="label">غذا</span>
            <select className="input" value={foodFilter} onChange={e => setFoodFilter(e.target.value)}>
              <option value="">همه</option>
              {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-1">
            {[7, 30, 90].map(d => <Button key={d} size="sm" variant="ghost" onClick={() => { setFrom(addDays(todayISO(), -d)); setTo(todayISO()) }}>{num(d)} روز</Button>)}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon="🍽️" label="تعداد پرس" value={num(qty)} />
        <Stat icon="💳" tone="blue" label="مبلغ کل" value={money(total)} />
        <Stat icon="👥" tone="green" label="تعداد نفرات سفارش‌دهنده" value={num(new Set(os.filter(o => o.employeeId).map(o => o.employeeId)).size)} />
      </div>

      <div className="no-print mt-6 mb-3 flex flex-wrap gap-2">
        {([['food', 'به تفکیک غذا'], ['employee', 'به تفکیک کارمند'], ['dept', 'به تفکیک واحد'], ['weekday', 'روزهای هفته'], ['detail', 'ریز سفارش‌ها (چه کسی چه خرید)']] as [Tab, string][]).map(([k, l]) => (
          <Button key={k} variant={tab === k ? 'primary' : 'ghost'} onClick={() => setTab(k)}>{l}</Button>
        ))}
      </div>

      {tab !== 'detail' ? (
        <div className="grid gap-6 xl:grid-cols-5">
          <Card title={`نمودار به تفکیک ${title}`} className="xl:col-span-2">
            <div style={{ height: Math.max(260, Math.min(rows.length, 15) * 30) }} dir="ltr">
              <ResponsiveContainer>
                <BarChart data={rows.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} reversed />
                  <YAxis type="category" dataKey="k" width={140} tick={{ fontSize: 11 }} orientation="right" />
                  <Tooltip formatter={(v: number) => num(v)} />
                  <Bar dataKey="qty" name="تعداد" fill="#ea580c" radius={[6, 0, 0, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title={`جدول به تفکیک ${title}`} className="xl:col-span-3">
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>#</th><th>{title}</th><th>تعداد</th><th>سهم</th><th>مبلغ</th><th>نفرات</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.k}>
                      <td>{num(i + 1)}</td><td className="font-semibold">{r.k}</td><td>{num(r.qty)}</td>
                      <td><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(r.qty / qty) * 100}%` }} /></div><span className="text-xs text-slate-400">{num((r.qty / qty) * 100)}٪</span></div></td>
                      <td>{money(r.amount)}</td><td>{num(r.people.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      ) : (
        <Card title={`ریز سفارش‌ها (${num(os.length)} ردیف)`}>
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>کد</th><th>نام</th><th>واحد</th><th>غذا</th><th>تعداد</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th></tr></thead>
              <tbody>
                {[...os].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500).map(o => {
                  const e = empName(o.employeeId)
                  const f = foodName(o.foodId)
                  return (
                    <tr key={o.id}>
                      <td>{faDate(o.date)}</td><td className="font-mono">{e?.code ?? '-'}</td><td>{e?.name ?? `⭐ ${o.guestTitle}`}</td><td>{e?.department ?? o.costCenter}</td>
                      <td>{f?.emoji} {f?.name}</td><td>{num(o.qty)}</td><td>{money(o.unitPrice * o.qty)}</td>
                      <td>{o.pay === 'wallet' ? <Badge color="violet">کیف پول</Badge> : o.pay === 'salary' ? <Badge color="blue">حقوق</Badge> : <Badge color="orange">شرکت</Badge>}</td>
                      <td>{o.status === 'delivered' ? <Badge color="green">تحویل</Badge> : <Badge color="amber">در انتظار</Badge>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
          {os.length > 500 && <p className="mt-6 text-center text-xs text-slate-400">۵۰۰ ردیف اول نمایش داده شد — برای همه ردیف‌ها خروجی اکسل بگیرید.</p>}
        </Card>
      )}
    </>
  )
}
