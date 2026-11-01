import { useState } from 'react'
import { useStore } from '../store'
import type { Food } from '../types'
import { Badge, Button, Card, Field, Modal, PageHeader, TableWrap, toast } from '../components/ui'
import { money, num, uid } from '../utils'

const blank = (): Food => ({ id: uid(), code: '', name: '', category: 'خورشتی', price: 0, emoji: '🍛', calories: 600, active: true, recipe: [] })

export default function FoodsPage() {
  const { foods, inventory, upsertFood, toggleFood, orders } = useStore()
  const [edit, setEdit] = useState<Food | null>(null)
  const [q, setQ] = useState('')
  const cost = (f: Food) => f.recipe.reduce((a, r) => a + (inventory.find(i => i.id === r.itemId)?.unitCost ?? 0) * r.qty, 0)
  const sold = (id: string) => orders.filter(o => o.foodId === id && o.status !== 'cancelled').reduce((a, o) => a + o.qty, 0)
  const list = foods.filter(f => f.name.includes(q) || f.code.toLowerCase().includes(q.toLowerCase()))

  const save = () => {
    if (!edit) return
    if (!edit.code || !edit.name || edit.price <= 0) return toast('کد، نام و قیمت الزامی است', 'err')
    if (foods.some(f => f.code === edit.code && f.id !== edit.id)) return toast('کد غذا تکراری است', 'err')
    upsertFood(edit)
    setEdit(null)
    toast('ذخیره شد ✓')
  }

  return (
    <>
      <PageHeader title="معرفی و مدیریت غذاها" subtitle="تعریف غذا، قیمت، دستور پخت (مواد اولیه) و محاسبه بهای تمام‌شده">
        <input className="input !w-56" placeholder="جستجو…" value={q} onChange={e => setQ(e.target.value)} />
        <Button onClick={() => setEdit(blank())}>+ غذای جدید</Button>
      </PageHeader>
      <Card>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>ردیف</th><th>کد</th><th>نام غذا</th><th>دسته</th><th>قیمت فروش</th><th>بهای تمام‌شده</th><th>حاشیه سود</th><th>فروش کل</th><th>وضعیت</th><th></th></tr></thead>
            <tbody>
              {list.map((f, i) => {
                const c = cost(f)
                const margin = f.price ? ((f.price - c) / f.price) * 100 : 0
                return (
                  <tr key={f.id} className={f.active ? '' : 'opacity-50'}>
                    <td>{num(i + 1)}</td>
                    <td className="font-mono">{f.code}</td>
                    <td className="font-semibold">{f.emoji} {f.name}</td>
                    <td><Badge>{f.category}</Badge></td>
                    <td>{money(f.price)}</td>
                    <td className="text-slate-500">{money(c)}</td>
                    <td><Badge color={margin > 30 ? 'green' : margin > 10 ? 'amber' : 'red'}>{num(margin)}٪</Badge></td>
                    <td>{num(sold(f.id))}</td>
                    <td>{f.active ? <Badge color="green">فعال</Badge> : <Badge color="red">غیرفعال</Badge>}</td>
                    <td className="space-x-1 space-x-reverse">
                      <Button size="sm" variant="soft" onClick={() => setEdit(structuredClone(f))}>ویرایش</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleFood(f.id)}>{f.active ? 'غیرفعال' : 'فعال'}</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit && foods.some(f => f.id === edit.id) ? 'ویرایش غذا' : 'غذای جدید'} wide>
        {edit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="کد غذا"><input className="input font-mono" value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} placeholder="F013" /></Field>
              <Field label="نام غذا"><input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="دسته"><input className="input" value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })} /></Field>
              <Field label="آیکون"><input className="input" value={edit.emoji} onChange={e => setEdit({ ...edit, emoji: e.target.value })} /></Field>
              <Field label="قیمت (ریال)"><input type="number" className="input" value={edit.price} onChange={e => setEdit({ ...edit, price: +e.target.value })} /></Field>
              <Field label="کالری"><input type="number" className="input" value={edit.calories} onChange={e => setEdit({ ...edit, calories: +e.target.value })} /></Field>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">دستور پخت (مصرف هر پرس)</span>
                <Button size="sm" variant="soft" onClick={() => setEdit({ ...edit, recipe: [...edit.recipe, { itemId: inventory[0].id, qty: 0.1 }] })}>+ ماده اولیه</Button>
              </div>
              <div className="space-y-2">
                {edit.recipe.map((r, i) => {
                  const item = inventory.find(x => x.id === r.itemId)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <select className="input" value={r.itemId} onChange={e => setEdit({ ...edit, recipe: edit.recipe.map((x, j) => (j === i ? { ...x, itemId: e.target.value } : x)) })}>
                        {inventory.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      <input type="number" step="0.01" className="input !w-28" value={r.qty} onChange={e => setEdit({ ...edit, recipe: edit.recipe.map((x, j) => (j === i ? { ...x, qty: +e.target.value } : x)) })} />
                      <span className="w-20 text-xs text-slate-400">{item?.unit}</span>
                      <button className="text-rose-500" onClick={() => setEdit({ ...edit, recipe: edit.recipe.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">بهای تمام‌شده مواد اولیه: <b>{money(cost(edit))}</b></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEdit(null)}>انصراف</Button>
              <Button onClick={save}>ثبت اطلاعات</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
