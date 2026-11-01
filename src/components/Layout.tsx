import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import type { Role } from '../types'
import { faLongDate, todayISO } from '../utils'

export const NAV: { to: string; label: string; icon: string; roles: Role[] }[] = [
  { to: '/', label: 'داشبورد', icon: '📊', roles: ['admin', 'accountant', 'storekeeper'] },
  { to: '/order', label: 'سفارش غذای کارکنان', icon: '🍽️', roles: ['admin', 'employee'] },
  { to: '/my', label: 'سفارش‌ها و کیف پول من', icon: '👤', roles: ['employee'] },
  { to: '/special', label: 'سفارش ویژه / مهمان', icon: '⭐', roles: ['admin'] },
  { to: '/menu', label: 'برنامه غذایی', icon: '📅', roles: ['admin', 'storekeeper'] },
  { to: '/foods', label: 'مدیریت غذاها', icon: '🍲', roles: ['admin', 'storekeeper'] },
  { to: '/kitchen', label: 'آشپزخانه و تحویل', icon: '👨‍🍳', roles: ['admin', 'storekeeper'] },
  { to: '/inventory', label: 'انبار', icon: '📦', roles: ['admin', 'storekeeper'] },
  { to: '/employees', label: 'کارکنان', icon: '👥', roles: ['admin', 'accountant'] },
  { to: '/accounting', label: 'حسابداری', icon: '💰', roles: ['admin', 'accountant'] },
  { to: '/reports', label: 'گزارش‌ها و آمار', icon: '📈', roles: ['admin', 'accountant', 'storekeeper'] },
  { to: '/settings', label: 'تنظیمات', icon: '⚙️', roles: ['admin'] },
]

const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'مدیر سیستم' },
  { id: 'accountant', label: 'حسابدار' },
  { id: 'storekeeper', label: 'انباردار / آشپزخانه' },
  { id: 'employee', label: 'کارمند' },
]

export default function Layout() {
  const { role, setRole, settings, employees, currentEmployeeId, setCurrentEmployee, inventory } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const low = inventory.filter(i => i.stock <= i.minStock).length
  const items = NAV.filter(n => n.roles.includes(role))

  return (
    <div className="flex min-h-full">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/logo.svg" className="h-10 w-10" alt="" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{settings.companyName}</div>
            <div className="truncate text-xs text-slate-400">{settings.unitName}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {items.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/30' : 'hover:bg-white/5 hover:text-white'}`
              }
            >
              <span className="text-base">{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.to === '/inventory' && low > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{low}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4 text-[11px] text-slate-500">نسخه نمایشی — داده‌ها در مرورگر ذخیره می‌شوند</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded-lg p-2 text-xl lg:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="hidden text-sm text-slate-500 sm:block">{faLongDate(todayISO())}</div>
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">نقش:</span>
            <select className="input !w-auto !py-1.5" value={role} onChange={e => setRole(e.target.value as Role)}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {role === 'employee' && (
              <select className="input !w-auto !py-1.5" value={currentEmployeeId} onChange={e => setCurrentEmployee(e.target.value)}>
                {employees.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
              </select>
            )}
          </div>
        </header>
        <main key={loc.pathname} className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
