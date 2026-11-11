import { WASTE_ORDER, wasteFromValue } from './theme'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const pad = (n) => String(n).padStart(2, '0')

export const parseDate = (value) => (value instanceof Date ? value : new Date(String(value).replace(/Z$/, '')))
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime()

export const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const formatDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
export const formatDayMonth = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
export const formatMonthYear = (d) => `${MONTHS_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
export const formatLongToday = (d = new Date()) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
export const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toInputDateTime = (d) => `${toInputDate(d)}T${formatTime(d)}`
export const fromInputDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const toLocalIso = (d) => `${toInputDate(d)}T${formatTime(d)}:00`

export const formatRelative = (value) => {
  const d = parseDate(value)
  const today = new Date()
  if (isSameDay(d, today)) return `Hoje, ${formatTime(d)}`
  if (isSameDay(d, addDays(today, -1))) return `Ontem, ${formatTime(d)}`
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${formatTime(d)}`
}

export const litros = (c) => (Number(c.TamanhoSaco) || 0) * (Number(c.Quantidade) || 0)
export const formatLitros = (n) => `${Math.round(n).toLocaleString('pt-BR')} L`

export const totalsByType = (coletas) => {
  const totals = { reciclavel: 0, papel: 0, naoReciclavel: 0 }
  coletas.forEach((c) => {
    totals[wasteFromValue(c.TipoResiduo).key] += litros(c)
  })
  return { ...totals, total: WASTE_ORDER.reduce((s, k) => s + totals[k], 0) }
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || ''

export const maskPhone = (value = '') => {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const isValidEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
export const isValidPhone = (v = '') => v.replace(/\D/g, '').length >= 10
