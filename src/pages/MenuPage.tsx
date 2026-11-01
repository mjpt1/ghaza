import { useState } from 'react'
import { useStore } from '../store'
import { Button, Card, PageHeader, toast } from '../components/ui'
import { addDays, faDate, faDay, isFriday, num, todayISO } from '../utils'
import { SIDE_CATEGORY } from '../seed'

export default function MenuPage() {
  const { menus, foods, setMenu, copyMenu, orders } = useStore()
  const [start, setStart] = useState(todayISO())
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter(d => !isFriday(d))
  const [edit, setEdit] = useState<string | null>(null)
  const active = foods.filter(f => f.active)

  const toggle = (date: string, id: string) => {
    const cur = menus.find(m => m.date === date)?.foodIds ?? []
    setMenu(date, cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  const copyWeek = () => {
    days.forEach(d => copyMenu(addDays(d, -7), d))
    toast('برنامه هفته قبل کپی شد')
  }

  return (
    <>
      <PageHeader title="برنامه غذایی هفتگی" subtitle="روی هر روز کلیک کنید و غذاهای قابل سفارش را انتخاب کنید">
        <Button variant="ghost" onClick={() => setStart(addDays(start, -7))}>→ هفته قبل</Button>
        <Button variant="ghost" onClick={() => setStart(todayISO())}>امروز</Button>
        <Button variant="ghost" onClick={() => setStart(addDays(start, 7))}>هفته بعد ←</Button>
        <Button variant="soft" onClick={copyWeek}>کپی از هفته قبل</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map(d => {
          const ids = menus.find(m => m.date === d)?.foodIds ?? []
          const count = orders.filter(o => o.date === d && o.status !== 'cancelled').reduce((a, o) => a + o.qty, 0)
          const editing = edit === d
          return (
            <Card
              key={d}
              title={<span>{faDay(d)} <span className="text-sm font-normal text-slate-400">{faDate(d)}</span></span>}
              action={<Button size="sm" variant={editing ? 'primary' : 'soft'} onClick={() => setEdit(editing ? null : d)}>{editing ? 'تأیید' : 'ویرایش'}</Button>}
              className={d === todayISO() ? 'ring-2 ring-brand-400' : ''}
            >
              {editing ? (
                <div className="grid grid-cols-2 gap-2">
                  {active.map(f => (
                    <label key={f.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${ids.includes(f.id) ? 'border-brand-400 bg-brand-50' : 'border-slate-200'}`}>
                      <input type="checkbox" checked={ids.includes(f.id)} onChange={() => toggle(d, f.id)} className="accent-brand-600" />
                      {f.emoji} {f.name}
                    </label>
                  ))}
                </div>
              ) : ids.length ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {ids.map(id => foods.find(f => f.id === id)).filter(Boolean).map(f => (
                      <span key={f!.id} className={`rounded-full px-2.5 py-1 text-xs ${f!.category === SIDE_CATEGORY ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'}`}>{f!.emoji} {f!.name}</span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{num(count)} سفارش ثبت شده</div>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-slate-400">برنامه‌ای ثبت نشده</div>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}
