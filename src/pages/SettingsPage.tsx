import { useState } from 'react'
import { useStore } from '../store'
import type { PayPolicy } from '../types'
import { Button, Card, Field, PageHeader, toast } from '../components/ui'

export default function SettingsPage() {
  const { settings, updateSettings, resetDemo } = useStore()
  const [f, setF] = useState(settings)

  const save = () => {
    updateSettings(f)
    toast('تنظیمات ذخیره شد ✓')
  }

  const policies: [PayPolicy, string, string][] = [
    ['salary', 'کسر از حقوق برای همه', 'هزینه هر نفر آخر ماه در لیست حقوق کسر می‌شود'],
    ['wallet', 'کیف پول اعتباری برای همه', 'حسابداری کیف پول را شارژ می‌کند و با هر سفارش کسر می‌شود'],
    ['choice', 'انتخابی برای هر کارمند', 'روش پرداخت در پرونده هر کارمند تعیین می‌شود'],
  ]

  return (
    <>
      <PageHeader title="تنظیمات سامانه" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="اطلاعات سازمان">
          <div className="space-y-3">
            <Field label="نام شرکت"><input className="input" value={f.companyName} onChange={e => setF({ ...f, companyName: e.target.value })} /></Field>
            <Field label="نام واحد"><input className="input" value={f.unitName} onChange={e => setF({ ...f, unitName: e.target.value })} /></Field>
            <Field label="عنوان سامانه"><input className="input" value={f.systemName} onChange={e => setF({ ...f, systemName: e.target.value })} /></Field>
          </div>
        </Card>
        <Card title="قوانین سفارش">
          <div className="grid grid-cols-2 gap-3">
            <Field label="مهلت سفارش (ساعت)"><input type="number" min={0} max={23} className="input" value={f.orderDeadlineHour} onChange={e => setF({ ...f, orderDeadlineHour: +e.target.value })} /></Field>
            <Field label="حداکثر غذای اصلی در روز"><input type="number" min={1} className="input" value={f.maxPerDay} onChange={e => setF({ ...f, maxPerDay: +e.target.value })} /></Field>
            <Field label="درصد یارانه شرکت"><input type="number" min={0} max={100} className="input" value={f.subsidyPercent} onChange={e => setF({ ...f, subsidyPercent: +e.target.value })} /></Field>
          </div>
        </Card>
        <Card title="روش پرداخت هزینه غذا" className="xl:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {policies.map(([k, t, d]) => (
              <label key={k} className={`cursor-pointer rounded-xl border-2 p-4 transition ${f.payPolicy === k ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'}`}>
                <input type="radio" className="hidden" checked={f.payPolicy === k} onChange={() => setF({ ...f, payPolicy: k })} />
                <div className="font-bold">{t}</div>
                <div className="mt-1 text-xs text-slate-500">{d}</div>
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={f.allowNegativeWallet} onChange={e => setF({ ...f, allowNegativeWallet: e.target.checked })} />
            اجازه سفارش با موجودی ناکافی کیف پول (بدهکار شدن)
          </label>
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button variant="danger" onClick={() => { if (confirm('همه داده‌ها به حالت اولیه دمو برمی‌گردند. ادامه؟')) { resetDemo(); setF(useStore.getState().settings); toast('داده‌های دمو بازنشانی شد') } }}>بازنشانی داده‌های دمو</Button>
        <Button onClick={save}>ذخیره تنظیمات</Button>
      </div>
    </>
  )
}
