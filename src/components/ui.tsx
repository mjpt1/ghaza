import type { ReactNode, ButtonHTMLAttributes } from 'react'

export const Card = ({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
        <h3 className="font-bold text-slate-700">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
)

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md' }
export const Button = ({ variant = 'primary', size = 'md', className = '', ...p }: BtnProps) => {
  const v = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }[variant]
  const s = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'
  return <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className}`} />
}

export const Badge = ({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'orange' | 'violet' }) => {
  const c = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-sky-50 text-sky-700',
    orange: 'bg-brand-50 text-brand-700',
    violet: 'bg-violet-50 text-violet-700',
  }[color]
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{children}</span>
}

export const Stat = ({ label, value, hint, icon, tone = 'orange' }: { label: string; value: ReactNode; hint?: ReactNode; icon: string; tone?: 'orange' | 'green' | 'blue' | 'violet' | 'red' }) => {
  const t = { orange: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', blue: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600', red: 'bg-rose-50 text-rose-600' }[tone]
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${t}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="truncate text-lg font-extrabold text-slate-800">{value}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  )
}

export const PageHeader = ({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    <div className="no-print flex flex-wrap gap-2">{children}</div>
  </div>
)

export const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`max-h-[90vh] w-full overflow-auto rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-slate-700">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export const Empty = ({ text }: { text: string }) => <div className="py-10 text-center text-sm text-slate-400">{text}</div>

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
  </label>
)

export const TableWrap = ({ children }: { children: ReactNode }) => <div className="-mx-5 -my-5 overflow-x-auto">{children}</div>

let toastTimer: number | undefined
export const toast = (msg: string, kind: 'ok' | 'err' = 'ok') => {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    document.body.appendChild(el)
  }
  el.className = `fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl transition ${kind === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'}`
  el.textContent = msg
  el.style.opacity = '1'
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (el!.style.opacity = '0'), 2600)
}
