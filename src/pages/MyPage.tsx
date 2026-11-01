import { effectivePayMode, useStore } from '../store'
import { Badge, Card, Empty, PageHeader, Stat, TableWrap } from '../components/ui'
import { faDate, jalaliMonthKey, money, num, todayISO } from '../utils'

export default function MyPage() {
  const { currentEmployeeId, employees, orders, foods, walletTx, settings } = useStore()
  const emp = employees.find(e => e.id === currentEmployeeId)
  if (!emp) return <Empty text="کارمند یافت نشد" />
  const mine = orders.filter(o => o.employeeId === emp.id && o.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date))
  const month = jalaliMonthKey(todayISO())
  const monthOrders = mine.filter(o => jalaliMonthKey(o.date) === month)
  const myShare = monthOrders.reduce((a, o) => a + (o.unitPrice - o.companyShare) * o.qty, 0)
  const mode = effectivePayMode(emp, settings)
  const tx = walletTx.filter(t => t.employeeId === emp.id).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <>
      <PageHeader title={`سلام ${emp.name} 👋`} subtitle={`${emp.department} — ${emp.position}`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon="🍽️" label="سفارش‌های ماه جاری" value={num(monthOrders.length)} />
        <Stat icon="💸" tone="blue" label={mode === 'salary' ? 'کسر از حقوق این ماه' : 'هزینه این ماه'} value={money(myShare)} />
        <Stat icon="👛" tone="violet" label="موجودی کیف پول" value={money(emp.wallet)} hint={mode === 'wallet' ? 'روش پرداخت: کیف پول' : 'روش پرداخت: کسر از حقوق'} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="تاریخچه سفارش‌ها">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>غذا</th><th>سهم من</th><th>وضعیت</th></tr></thead>
              <tbody>
                {mine.slice(0, 40).map(o => (
                  <tr key={o.id}>
                    <td>{faDate(o.date)}</td>
                    <td>{foods.find(f => f.id === o.foodId)?.name}</td>
                    <td>{money((o.unitPrice - o.companyShare) * o.qty)}</td>
                    <td>{o.status === 'delivered' ? <Badge color="green">تحویل شده</Badge> : <Badge color="amber">در انتظار</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
        <Card title="گردش کیف پول">
          {!tx.length ? <Empty text="تراکنشی وجود ندارد" /> : (
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>تاریخ</th><th>شرح</th><th>مبلغ</th></tr></thead>
                <tbody>
                  {tx.slice(0, 40).map(t => (
                    <tr key={t.id}>
                      <td>{faDate(t.date)}</td>
                      <td>{t.note}</td>
                      <td className={t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'} dir="ltr">{money(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  )
}
