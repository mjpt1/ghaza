import { useState } from 'react'
import { useStore } from '../store'
import { Badge, Button, Card, Field, PageHeader, TableWrap, toast } from '../components/ui'
import { faDate, money, num, todayISO } from '../utils'

export default function SpecialPage() {
  const { foods, orders, placeOrder, cancelOrder, employees } = useStore()
  const depts = [...new Set(employees.map(e => e.department))]
  const [form, setForm] = useState({ date: todayISO(), foodId: foods[0]?.id ?? '', qty: 10, guestTitle: '', costCenter: depts[0] ?? '', note: '' })
  const food = foods.find(f => f.id === form.foodId)
  const list = orders.filter(o => o.type === 'special').sort((a, b) => b.createdAt - a.createdAt)

  const submit = () => {
    if (!form.guestTitle.trim()) return toast('عنوان جلسه / مهمان را وارد کنید', 'err')
    const err = placeOrder({ ...form, type: 'special', employeeId: null })
    if (err) return toast(err, 'err')
    toast('سفارش ویژه ثبت شد ✓')
    setForm({ ...form, guestTitle: '', note: '' })
  }

  return (
    <>
      <PageHeader title="سفارش ویژه / مهمان" subtitle="ثبت سفارش با تعداد دلخواه برای جلسات، مهمانان و مدیران — هزینه به حساب مرکز هزینه" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="ثبت سفارش جدید">
          <div className="space-y-3">
            <Field label="عنوان جلسه / مهمان"><input className="input" value={form.guestTitle} onChange={e => setForm({ ...form, guestTitle: e.target.value })} placeholder="مثلاً جلسه هیئت مدیره" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="تاریخ"><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="تعداد"><input type="number" min={1} className="input" value={form.qty} onChange={e => setForm({ ...form, qty: +e.target.value })} /></Field>
            </div>
            <Field label="غذا">
              <select className="input" value={form.foodId} onChange={e => setForm({ ...form, foodId: e.target.value })}>
                {foods.filter(f => f.active).map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name} — {money(f.price)}</option>)}
              </select>
            </Field>
            <Field label="مرکز هزینه">
              <select className="input" value={form.costCenter} onChange={e => setForm({ ...form, costCenter: e.target.value })}>
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="توضیحات"><textarea className="input" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="rounded-xl bg-brand-50 p-3 text-sm">جمع کل: <b className="text-brand-700">{money((food?.price ?? 0) * form.qty)}</b></div>
            <Button className="w-full" onClick={submit}>ثبت سفارش</Button>
          </div>
        </Card>
        <Card title="سفارش‌های ویژه" className="xl:col-span-2">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>عنوان</th><th>غذا</th><th>تعداد</th><th>مبلغ</th><th>مرکز هزینه</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>
                {list.slice(0, 50).map(o => (
                  <tr key={o.id}>
                    <td>{faDate(o.date)}</td>
                    <td>{o.guestTitle}</td>
                    <td>{foods.find(f => f.id === o.foodId)?.name}</td>
                    <td>{num(o.qty)}</td>
                    <td>{money(o.unitPrice * o.qty)}</td>
                    <td>{o.costCenter}</td>
                    <td>{o.status === 'delivered' ? <Badge color="green">تحویل</Badge> : o.status === 'cancelled' ? <Badge color="red">لغو</Badge> : <Badge color="amber">در انتظار</Badge>}</td>
                    <td>{o.status === 'pending' && <Button size="sm" variant="danger" onClick={() => cancelOrder(o.id)}>لغو</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    </>
  )
}
