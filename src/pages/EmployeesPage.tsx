import { useState } from 'react'
import { effectivePayMode, useStore } from '../store'
import type { Employee } from '../types'
import { Badge, Button, Card, Field, Modal, PageHeader, TableWrap, toast } from '../components/ui'
import { downloadCSV, money, num, uid } from '../utils'

export default function EmployeesPage() {
  const { employees, orders, settings, upsertEmployee } = useStore()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [edit, setEdit] = useState<Employee | null>(null)
  const depts = [...new Set(employees.map(e => e.department))]
  const list = employees.filter(e => (!dept || e.department === dept) && (e.name.includes(q) || e.code.includes(q)))
  const count = (id: string) => orders.filter(o => o.employeeId === id && o.status !== 'cancelled').length

  const save = () => {
    if (!edit?.name || !edit.code) return toast('نام و کد الزامی است', 'err')
    if (employees.some(e => e.code === edit.code && e.id !== edit.id)) return toast('کد پرسنلی تکراری است', 'err')
    upsertEmployee(edit)
    setEdit(null)
    toast('ذخیره شد ✓')
  }

  return (
    <>
      <PageHeader title="کارکنان" subtitle={`${num(employees.filter(e => e.active).length)} نفر فعال`}>
        <input className="input !w-48" placeholder="جستجو…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input !w-auto" value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">همه واحدها</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <Button variant="ghost" onClick={() => downloadCSV('employees.csv', [['کد', 'نام', 'واحد', 'سمت', 'روش پرداخت', 'کیف پول'], ...employees.map(e => [e.code, e.name, e.department, e.position, effectivePayMode(e, settings) === 'wallet' ? 'کیف پول' : 'کسر از حقوق', e.wallet])])}>⬇ خروجی</Button>
        <Button onClick={() => setEdit({ id: uid(), code: String(1001 + employees.length), name: '', department: depts[0], position: '', payMode: 'salary', wallet: 0, active: true })}>+ کارمند جدید</Button>
      </PageHeader>
      <Card>
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>کد</th><th>نام</th><th>واحد</th><th>سمت</th><th>روش پرداخت</th><th>کیف پول</th><th>تعداد سفارش</th><th>وضعیت</th><th></th></tr></thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} className={e.active ? '' : 'opacity-50'}>
                  <td className="font-mono">{e.code}</td>
                  <td className="font-semibold">{e.name}</td>
                  <td>{e.department}</td>
                  <td className="text-slate-500">{e.position}</td>
                  <td>{effectivePayMode(e, settings) === 'wallet' ? <Badge color="violet">کیف پول</Badge> : <Badge color="blue">کسر از حقوق</Badge>}</td>
                  <td className={e.wallet < 0 ? 'text-rose-600' : ''}>{money(e.wallet)}</td>
                  <td>{num(count(e.id))}</td>
                  <td>{e.active ? <Badge color="green">فعال</Badge> : <Badge color="red">غیرفعال</Badge>}</td>
                  <td><Button size="sm" variant="soft" onClick={() => setEdit({ ...e })}>ویرایش</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="اطلاعات کارمند">
        {edit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="کد پرسنلی"><input className="input" value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} /></Field>
              <Field label="نام و نام خانوادگی"><input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="واحد"><input className="input" list="depts" value={edit.department} onChange={e => setEdit({ ...edit, department: e.target.value })} /></Field>
              <Field label="سمت"><input className="input" value={edit.position} onChange={e => setEdit({ ...edit, position: e.target.value })} /></Field>
              <Field label="روش پرداخت">
                <select className="input" value={edit.payMode} onChange={e => setEdit({ ...edit, payMode: e.target.value as Employee['payMode'] })} disabled={settings.payPolicy !== 'choice'}>
                  <option value="salary">کسر از حقوق</option>
                  <option value="wallet">کیف پول</option>
                </select>
              </Field>
              <Field label="وضعیت">
                <select className="input" value={edit.active ? '1' : '0'} onChange={e => setEdit({ ...edit, active: e.target.value === '1' })}>
                  <option value="1">فعال</option>
                  <option value="0">غیرفعال</option>
                </select>
              </Field>
            </div>
            {settings.payPolicy !== 'choice' && <p className="text-xs text-amber-600">روش پرداخت در تنظیمات برای همه یکسان تعیین شده است.</p>}
            <datalist id="depts">{depts.map(d => <option key={d} value={d} />)}</datalist>
            <Button className="w-full" onClick={save}>ذخیره</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
