import { useState } from 'react'
import { useStore } from '../store'
import type { InventoryItem } from '../types'
import { Badge, Button, Card, Field, Modal, PageHeader, Stat, TableWrap, toast } from '../components/ui'
import { downloadCSV, faDate, money, num, uid } from '../utils'

const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString('fa-IR')

export default function InventoryPage() {
  const { inventory, stockMoves, upsertItem, stockMove } = useStore()
  const [tab, setTab] = useState<'stock' | 'moves'>('stock')
  const [moveFor, setMoveFor] = useState<{ item: InventoryItem; dir: 1 | -1 } | null>(null)
  const [mv, setMv] = useState({ qty: 0, cost: 0, reason: '' })
  const [edit, setEdit] = useState<InventoryItem | null>(null)

  const value = inventory.reduce((a, i) => a + i.stock * i.unitCost, 0)
  const low = inventory.filter(i => i.stock <= i.minStock)

  const openMove = (item: InventoryItem, dir: 1 | -1) => {
    setMoveFor({ item, dir })
    setMv({ qty: 0, cost: item.unitCost, reason: dir === 1 ? 'خرید / ورود به انبار' : 'ضایعات' })
  }
  const doMove = () => {
    if (!moveFor || mv.qty <= 0) return toast('مقدار نامعتبر', 'err')
    stockMove(moveFor.item.id, moveFor.dir * mv.qty, mv.reason, moveFor.dir === 1 ? mv.cost : undefined)
    setMoveFor(null)
    toast('ثبت شد ✓')
  }

  const exportCSV = () =>
    downloadCSV('inventory.csv', [['کالا', 'واحد', 'موجودی', 'حداقل', 'قیمت واحد', 'ارزش'], ...inventory.map(i => [i.name, i.unit, i.stock, i.minStock, i.unitCost, i.stock * i.unitCost])])

  return (
    <>
      <PageHeader title="انبار مواد اولیه" subtitle="موجودی، ورود و خروج کالا، هشدار نقطه سفارش">
        <Button variant="ghost" onClick={exportCSV}>⬇ خروجی اکسل</Button>
        <Button onClick={() => setEdit({ id: uid(), name: '', unit: 'کیلوگرم', stock: 0, minStock: 0, unitCost: 0 })}>+ کالای جدید</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon="📦" label="تعداد اقلام" value={num(inventory.length)} />
        <Stat icon="💰" tone="green" label="ارزش کل موجودی" value={money(value)} />
        <Stat icon="⚠️" tone="red" label="زیر نقطه سفارش" value={num(low.length)} hint={low.map(i => i.name).join('، ')} />
      </div>

      <div className="mt-6 mb-3 flex gap-2">
        <Button variant={tab === 'stock' ? 'primary' : 'ghost'} onClick={() => setTab('stock')}>موجودی</Button>
        <Button variant={tab === 'moves' ? 'primary' : 'ghost'} onClick={() => setTab('moves')}>گردش کالا</Button>
      </div>

      <Card>
        <TableWrap>
          {tab === 'stock' ? (
            <table className="tbl">
              <thead><tr><th>کالا</th><th>موجودی</th><th>حداقل</th><th>سطح</th><th>قیمت واحد</th><th>ارزش</th><th></th></tr></thead>
              <tbody>
                {inventory.map(i => {
                  const pct = Math.min(100, (i.stock / Math.max(i.minStock * 3, 1)) * 100)
                  const isLow = i.stock <= i.minStock
                  return (
                    <tr key={i.id}>
                      <td className="font-semibold">{i.name} {isLow && <Badge color="red">کمبود</Badge>}</td>
                      <td>{fmt(i.stock)} {i.unit}</td>
                      <td className="text-slate-400">{fmt(i.minStock)}</td>
                      <td className="w-40"><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${isLow ? 'bg-rose-500' : pct < 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div></td>
                      <td>{money(i.unitCost)}</td>
                      <td>{money(i.stock * i.unitCost)}</td>
                      <td className="space-x-1 space-x-reverse">
                        <Button size="sm" variant="soft" onClick={() => openMove(i, 1)}>+ ورود</Button>
                        <Button size="sm" variant="danger" onClick={() => openMove(i, -1)}>− خروج</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEdit({ ...i })}>ویرایش</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>کالا</th><th>مقدار</th><th>شرح</th></tr></thead>
              <tbody>
                {[...stockMoves].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200).map(m => {
                  const i = inventory.find(x => x.id === m.itemId)
                  return (
                    <tr key={m.id}>
                      <td>{faDate(m.date)}</td>
                      <td>{i?.name}</td>
                      <td className={m.qty >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{m.qty >= 0 ? '+' : '−'}{fmt(Math.abs(m.qty))} {i?.unit}</td>
                      <td>{m.reason}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>

      <Modal open={!!moveFor} onClose={() => setMoveFor(null)} title={`${moveFor?.dir === 1 ? 'ورود' : 'خروج'} — ${moveFor?.item.name}`}>
        <div className="space-y-3">
          <Field label={`مقدار (${moveFor?.item.unit})`}><input type="number" className="input" value={mv.qty} onChange={e => setMv({ ...mv, qty: +e.target.value })} /></Field>
          {moveFor?.dir === 1 && <Field label="قیمت خرید واحد (ریال)"><input type="number" className="input" value={mv.cost} onChange={e => setMv({ ...mv, cost: +e.target.value })} /></Field>}
          <Field label="شرح"><input className="input" value={mv.reason} onChange={e => setMv({ ...mv, reason: e.target.value })} /></Field>
          <Button className="w-full" onClick={doMove}>ثبت</Button>
        </div>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="اطلاعات کالا">
        {edit && (
          <div className="space-y-3">
            <Field label="نام کالا"><input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="واحد"><input className="input" value={edit.unit} onChange={e => setEdit({ ...edit, unit: e.target.value })} /></Field>
              <Field label="حداقل موجودی"><input type="number" className="input" value={edit.minStock} onChange={e => setEdit({ ...edit, minStock: +e.target.value })} /></Field>
              <Field label="قیمت واحد"><input type="number" className="input" value={edit.unitCost} onChange={e => setEdit({ ...edit, unitCost: +e.target.value })} /></Field>
            </div>
            <Button className="w-full" onClick={() => { if (!edit.name) return toast('نام الزامی است', 'err'); upsertItem(edit); setEdit(null); toast('ذخیره شد ✓') }}>ذخیره</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
