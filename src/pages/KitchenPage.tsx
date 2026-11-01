import { useState } from 'react'
import { useStore } from '../store'
import { Badge, Button, Card, Empty, PageHeader, TableWrap, toast } from '../components/ui'
import { faDate, faDay, num, todayISO } from '../utils'

export default function KitchenPage() {
  const { orders, foods, inventory, employees, deliverDay } = useStore()
  const [date, setDate] = useState(todayISO())
  const dayOrders = orders.filter(o => o.date === date && o.status !== 'cancelled')
  const pending = dayOrders.filter(o => o.status === 'pending')

  const byFood = foods
    .map(f => {
      const os = dayOrders.filter(o => o.foodId === f.id)
      return { f, os, total: os.reduce((a, o) => a + o.qty, 0), pending: os.filter(o => o.status === 'pending').reduce((a, o) => a + o.qty, 0) }
    })
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total)

  const need: Record<string, number> = {}
  pending.forEach(o => foods.find(f => f.id === o.foodId)?.recipe.forEach(r => (need[r.itemId] = (need[r.itemId] ?? 0) + r.qty * o.qty)))
  const needRows = Object.entries(need).map(([id, q]) => ({ item: inventory.find(i => i.id === id)!, q })).filter(x => x.item)

  const deliver = () => {
    const r = deliverDay(date)
    toast(r.shortages.length ? `${num(r.delivered)} سفارش تحویل شد — کمبود: ${r.shortages.join('، ')}` : `${num(r.delivered)} سفارش تحویل و از انبار کسر شد ✓`, r.shortages.length ? 'err' : 'ok')
  }

  return (
    <>
      <PageHeader title="آشپزخانه و تحویل" subtitle={`${faDay(date)} ${faDate(date)} — برنامه تولید، مواد مورد نیاز و لیست تحویل`}>
        <input type="date" className="input !w-auto" value={date} onChange={e => setDate(e.target.value)} />
        <Button variant="ghost" onClick={() => window.print()}>🖨️ چاپ</Button>
        <Button disabled={!pending.length} onClick={deliver}>✓ تحویل همه و کسر از انبار</Button>
      </PageHeader>

      {!byFood.length ? <Card><Empty text="برای این روز سفارشی وجود ندارد" /></Card> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {byFood.map(({ f, total, pending }) => (
              <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <div className="text-3xl">{f.emoji}</div>
                <div className="mt-1 text-sm font-semibold">{f.name}</div>
                <div className="text-3xl font-extrabold text-brand-600">{num(total)}</div>
                <div className="text-xs text-slate-400">{pending ? `${num(pending)} در انتظار` : 'تحویل شده'}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card title="مواد اولیه مورد نیاز (سفارش‌های در انتظار)">
              {!needRows.length ? <Empty text="همه سفارش‌ها تحویل شده‌اند" /> : (
                <TableWrap>
                  <table className="tbl">
                    <thead><tr><th>ماده اولیه</th><th>مورد نیاز</th><th>موجودی</th><th>وضعیت</th></tr></thead>
                    <tbody>
                      {needRows.map(({ item, q }) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{(Math.round(q * 100) / 100).toLocaleString('fa-IR')} {item.unit}</td>
                          <td>{item.stock.toLocaleString('fa-IR')} {item.unit}</td>
                          <td>{q > item.stock ? <Badge color="red">کمبود</Badge> : <Badge color="green">کافی</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </Card>
            <Card title="لیست تحویل به تفکیک غذا">
              <div className="max-h-[480px] space-y-4 overflow-auto">
                {byFood.map(({ f, os }) => (
                  <div key={f.id}>
                    <div className="mb-1 text-sm font-bold">{f.emoji} {f.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {os.map(o => {
                        const e = employees.find(x => x.id === o.employeeId)
                        return (
                          <span key={o.id} className={`rounded-md px-2 py-0.5 text-xs ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>
                            {e ? `${e.name} (${e.code})` : `⭐ ${o.guestTitle} ×${num(o.qty)}`}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
