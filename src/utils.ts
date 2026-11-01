// Helpers for dates (Persian calendar display), money and CSV export.

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const toISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayISO = () => toISO(new Date())

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

const faDateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' })
const faWeekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' })
const faLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long' })
const faMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long' })
const latnParts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' })

const asDate = (iso: string) => new Date(iso + 'T12:00:00')

export const faDate = (iso: string) => faDateFmt.format(asDate(iso))
export const faDay = (iso: string) => faWeekday.format(asDate(iso))
export const faLongDate = (iso: string) => faLong.format(asDate(iso))

/** Jalali "YYYY-MM" key, used to group by Persian month. */
export const jalaliMonthKey = (iso: string) => {
  const parts = latnParts.formatToParts(asDate(iso))
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value.padStart(2, '0')
  return `${y}-${m}`
}

export const jalaliMonthLabel = (key: string, sampleIso: string) => faMonth.format(asDate(sampleIso))

export const isFriday = (iso: string) => asDate(iso).getDay() === 5

const nf = new Intl.NumberFormat('fa-IR')
export const num = (n: number) => nf.format(Math.round(n))
export const money = (n: number) => `${nf.format(Math.round(n))} ریال`

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Seeded random generator so demo data looks the same on each reset. */
export const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
