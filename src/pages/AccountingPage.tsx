import { useMemo, useState } from 'react'
import { effectivePayMode, useStore } from '../store'
import { Badge, Button, Card, Field, Modal, PageHeader, Stat, TableWrap, toast } from '../components/ui'
import { downloadCSV, faDate, jalaliMonthKey, jalaliMonthLabel, money, num, todayISO } from '../utils'

type Tab = 'summary' | 'payroll' | 'wallet' | 'cost' | 'ledger'

export default function AccountingPage() {
  const { orders, employees, foods, inventory, stockMoves, walletTx, settings, chargeWallet } = useStore()
  const months = useMemo(() => {
    const m = new Map<string, string>()
    orders.forEach(o => { const k = jalaliMonthKey(o.date); if (!m.has(k)) m.set(k, o.date) })
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [orders])
  const [month, setMonth] = useState(jalaliMonthKey(todayISO()))
  const [tab, setTab] = useState<Tab>('summary')
  const [charge, setCharge] = useState<{ id: string | 'all'; amount: number } | null>(null)

  const mo = orders.filter(o => o.status !== 'cancelled' && jalaliMonthKey(o.date) === month)
  const emp = mo.filter(o => o.type === 'employee')
  const special = mo.filter(o => o.type === 'special')
  const sum = (os: typeof mo, f: (o: (typeof mo)[0]) => number) => os.reduce((a, o) => a + f(o), 0)
  const gross = sum(mo, o => o.unitPrice * o.qty)
  const subsidy = sum(emp, o => o.companyShare * o.qty)
  const empShare = sum(emp, o => (o.unitPrice - o.companyShare) * o.qty)
  const salaryShare = sum(emp.filter(o => o.pay === 'salary'), o => (o.unitPrice - o.companyShare) * o.qty)
  const walletShare = sum(emp.filter(o => o.pay === 'wallet'), o => (o.unitPrice - o.companyShare) * o.qty)
  const specialCost = sum(special, o => o.unitPrice * o.qty)
  const materialCost = sum(mo, o => (foods.find(f => f.id === o.foodId)?.recipe ?? []).reduce((a, r) => a + (inventory.find(i => i.id === r.itemId)?.unitCost ?? 0) * r.qty, 0) * o.qty)
  const purchases = stockMoves.filter(m => m.qty > 0 && m.createdAt > 0 && jalaliMonthKey(m.date) === month).reduce((a, m) => a + m.qty * (inventory.find(i => i.id === m.itemId)?.unitCost ?? 0), 0)

  const payroll = employees
    .map(e => {
      const os = emp.filter(o => o.employeeId === e.id && o.pay === 'salary')
      return { e, count: sum(os, o => o.qty), total: sum(os, o => o.unitPrice * o.qty), company: sum(os, o => o.companyShare * o.qty), deduct: sum(os, o => (o.unitPrice - o.companyShare) * o.qty) }
    })
    .filter(r => r.count > 0)
    .sort((a, b) => a.e.code.localeCompare(b.e.code))

  const costCenters = Object.entries(special.reduce<Record<string, number>>((a, o) => ((a[o.costCenter ?? '-'] = (a[o.costCenter ?? '-'] ?? 0) + o.unitPrice * o.qty), a), {}))
  const walletUsers = employees.filter(e => effectivePayMode(e, settings) === 'wallet' || e.wallet !== 0)

  const doCharge = () => {
    if (!charge || charge.amount <= 0) return toast('مبلغ نامعتبر', 'err')
    const targets = charge.id === 'all' ? employees.filter(e => e.active && effectivePayMode(e, settings) === 'wallet').map(e => e.id) : [charge.id]
    targets.forEach(id => chargeWallet(id, charge.amount, charge.id === 'all' ? 'شارژ گروهی ماهانه' : 'شارژ توسط حسابداری'))
    toast(`${num(targets.length)} کیف پول شارژ شد ✓`)
    setCharge(null)
  }

  const monthLabel = jalaliMonthLabel(month, months.find(m => m[0] === month)?.[1] ?? todayISO())

  return (
    <>
      <PageHeader title="حسابداری" subtitle={`دوره مالی: ${monthLabel}`}>
        <select className="input !w-auto" value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(([k, d]) => <option key={k} value={k}>{jalaliMonthLabel(k, d)}</option>)}
        </select>
        <Button variant="ghost" onClick={() => window.print()}>🖨️ چاپ</Button>
      </PageHeader>

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {([['summary', 'خلاصه مالی'], ['payroll', 'لیست کسر از حقوق'], ['wallet', 'کیف پول کارکنان'], ['cost', 'مراکز هزینه'], ['ledger', 'دفتر تراکنش‌ها']] as [Tab, string][]).map(([k, l]) => (
          <Button key={k} variant={tab === k ? 'primary' : 'ghost'} onClick={() => setTab(k)}>{l}</Button>
        ))}
      </div>

      {tab === 'summary' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon="🧾" label="فروش ناخالص" value={money(gross)} hint={`${num(mo.length)} قلم`} />
            <Stat icon="🏢" tone="green" label="یارانه شرکت" value={money(subsidy)} hint={`${num(settings.subsidyPercent)}٪ سهم شرکت`} />
            <Stat icon="👥" tone="blue" label="سهم کارکنان" value={money(empShare)} />
            <Stat icon="⭐" tone="violet" label="سفارش‌های ویژه" value={money(specialCost)} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card title="ترکیب دریافتی از کارکنان">
              <div className="space-y-3 text-sm">
                <Line k="کسر از حقوق" v={money(salaryShare)} />
                <Line k="پرداخت از کیف پول" v={money(walletShare)} />
                <Line k="جمع سهم کارکنان" v={money(empShare)} bold />
              </div>
            </Card>
            <Card title="هزینه و بهای تمام‌شده">
              <div className="space-y-3 text-sm">
                <Line k="بهای مواد اولیه مصرفی (برآوردی)" v={money(materialCost)} />
                <Line k="خرید انبار در این دوره" v={money(purchases)} />
                <Line k="هزینه کل شرکت (یارانه + ویژه)" v={money(subsidy + specialCost)} bold />
                <Line k="حاشیه (فروش − مواد اولیه)" v={money(gross - materialCost)} bold />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'payroll' && (
        <Card
          title={`لیست کسر از حقوق — ${monthLabel}`}
          action={<Button size="sm" variant="soft" onClick={() => downloadCSV(`payroll-${month}.csv`, [['کد پرسنلی', 'نام', 'واحد', 'تعداد', 'مبلغ کل', 'سهم شرکت', 'کسر از حقوق'], ...payroll.map(r => [r.e.code, r.e.name, r.e.department, r.count, r.total, r.company, r.deduct])])}>⬇ خروجی برای واحد حقوق</Button>}
        >
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>کد</th><th>نام</th><th>واحد</th><th>تعداد</th><th>مبلغ کل</th><th>سهم شرکت</th><th>کسر از حقوق</th></tr></thead>
              <tbody>
                {payroll.map(r => (
                  <tr key={r.e.id}>
                    <td className="font-mono">{r.e.code}</td><td>{r.e.name}</td><td>{r.e.department}</td><td>{num(r.count)}</td>
                    <td>{money(r.total)}</td><td className="text-emerald-600">{money(r.company)}</td><td className="font-bold">{money(r.deduct)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-bold">
                  <td className="px-3 py-3" colSpan={3}>جمع کل</td>
                  <td className="px-3">{num(payroll.reduce((a, r) => a + r.count, 0))}</td>
                  <td className="px-3">{money(payroll.reduce((a, r) => a + r.total, 0))}</td>
                  <td className="px-3">{money(payroll.reduce((a, r) => a + r.company, 0))}</td>
                  <td className="px-3">{money(payroll.reduce((a, r) => a + r.deduct, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'wallet' && (
        <Card title="کیف پول کارکنان" action={<Button size="sm" onClick={() => setCharge({ id: 'all', amount: 20_000_000 })}>شارژ گروهی</Button>}>
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>کد</th><th>نام</th><th>روش پرداخت</th><th>موجودی</th><th></th></tr></thead>
              <tbody>
                {walletUsers.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono">{e.code}</td><td>{e.name}</td>
                    <td>{effectivePayMode(e, settings) === 'wallet' ? <Badge color="violet">کیف پول</Badge> : <Badge color="blue">کسر از حقوق</Badge>}</td>
                    <td className={e.wallet < 2_000_000 ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>{money(e.wallet)}</td>
                    <td><Button size="sm" variant="soft" onClick={() => setCharge({ id: e.id, amount: 10_000_000 })}>شارژ</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'cost' && (
        <Card title="سفارش‌های ویژه به تفکیک مرکز هزینه">
          <div className="space-y-3 text-sm">
            {costCenters.length ? costCenters.map(([k, v]) => <Line key={k} k={k} v={money(v)} />) : <div className="text-slate-400">سفارش ویژه‌ای در این دوره نیست</div>}
          </div>
        </Card>
      )}

      {tab === 'ledger' && (
        <Card title="دفتر تراکنش‌های کیف پول">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>کارمند</th><th>شرح</th><th>مبلغ</th></tr></thead>
              <tbody>
                {walletTx.filter(t => jalaliMonthKey(t.date) === month).sort((a, b) => b.createdAt - a.createdAt).slice(0, 300).map(t => (
                  <tr key={t.id}>
                    <td>{faDate(t.date)}</td>
                    <td>{employees.find(e => e.id === t.employeeId)?.name}</td>
                    <td>{t.note}</td>
                    <td className={t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{money(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      <Modal open={!!charge} onClose={() => setCharge(null)} title={charge?.id === 'all' ? 'شارژ گروهی همه کیف پول‌ها' : `شارژ کیف پول ${employees.find(e => e.id === charge?.id)?.name ?? ''}`}>
        {charge && (
          <div className="space-y-3">
            <Field label="مبلغ (ریال)"><input type="number" className="input" value={charge.amount} onChange={e => setCharge({ ...charge, amount: +e.target.value })} /></Field>
            <div className="text-sm text-slate-500">{money(charge.amount)}</div>
            <Button className="w-full" onClick={doCharge}>شارژ</Button>
          </div>
        )}
      </Modal>
    </>
  )
}

const Line = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div className={`flex justify-between border-b border-dashed border-slate-200 pb-2 ${bold ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
    <span>{k}</span><span>{v}</span>
  </div>
)
