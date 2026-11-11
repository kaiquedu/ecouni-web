import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, Inbox, Recycle, WifiOff, X } from 'lucide-react'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import { initials } from '../lib/format'

export function Button({ children, variant, loading, disabled, icon: Icon, className = '', ...props }) {
  const cls = ['btn', variant && `btn-${variant}`, className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="spinner" aria-hidden /> : Icon ? <Icon size={17} aria-hidden /> : null}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, danger, ...props }) {
  return (
    <button type="button" className={`ib${danger ? ' danger' : ''}`} aria-label={label} title={label} {...props}>
      <Icon size={18} aria-hidden />
    </button>
  )
}

export const Field = forwardRef(function Field({ label, optional, icon: Icon, error, hint, type = 'text', multiline, small, className = '', ...props }, ref) {
  const id = useId()
  const [show, setShow] = useState(false)
  const Tag = multiline ? 'textarea' : 'input'
  const control = (
    <div className={`inp${error ? ' bad' : ''}${small ? ' sm' : ''} ${label ? '' : className}`}>
      {Icon ? <Icon size={18} aria-hidden /> : null}
      <Tag ref={ref} id={id} type={multiline ? undefined : type === 'password' && show ? 'text' : type} aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${id}-m` : undefined} {...props} />
      {type === 'password' ? <IconButton icon={show ? EyeOff : Eye} label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow((s) => !s)} /> : null}
    </div>
  )
  if (!label) return control
  return (
    <div className={`fld ${className}`}>
      <label className="fld-l" htmlFor={id}>
        {label} {optional ? <em>{optional}</em> : null}
      </label>
      {control}
      {error ? (
        <small id={`${id}-m`} className="err" role="alert">
          {error}
        </small>
      ) : hint ? (
        <small id={`${id}-m`} className="hint">
          {hint}
        </small>
      ) : null}
    </div>
  )
})

export function Seg({ options, value, onChange, label, full }) {
  const ref = useRef(null)
  const [pill, setPill] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current?.querySelector('[aria-pressed="true"]')
    if (!el) return
    const update = () => setPill({ x: el.offsetLeft, w: el.offsetWidth })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [value, options.length])
  return (
    <div className={`seg${full ? ' full' : ''}`} role="group" aria-label={label} ref={ref}>
      {pill ? <span className="seg-pill" style={{ width: pill.w, transform: `translateX(${pill.x}px)` }} aria-hidden /> : null}
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const Logo = ({ word = true }) => (
  <span className="logo" aria-label="EcoUni">
    <span className="mk">
      <Recycle size={17} aria-hidden />
    </span>
    {word ? (
      <span className="lw" aria-hidden>
        ECO<b>U</b>NI
      </span>
    ) : null}
  </span>
)

export const Dot = ({ type }) => <i className="dot" style={{ background: type.color }} aria-hidden />

export const TypeBar = ({ totals }) => (
  <div className="cb" aria-hidden>
    {WASTE_ORDER.map((k) => (totals[k] > 0 ? <i key={k} style={{ flexGrow: totals[k], background: WASTE_TYPES[k].color }} /> : null))}
  </div>
)

export const Avatar = ({ name, size = 32, dark }) => (
  <span className={`av${dark ? ' dark' : ''}`} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
    {initials(name)}
  </span>
)

export const Skeleton = ({ h = 16, w = '100%', style }) => <span className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden />

export function EmptyState({ icon: Icon = Inbox, title, message, action, onAction }) {
  return (
    <div className="state">
      <span className="state-icon">
        <Icon size={22} aria-hidden />
      </span>
      <b>{title}</b>
      {message ? <p>{message}</p> : null}
      {action ? (
        <Button variant="s" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  )
}

export const ErrorState = ({ message, onRetry }) => <EmptyState icon={WifiOff} title="Não foi possível carregar" message={message} action="Tentar novamente" onAction={onRetry} />

export function useEscape(active, fn) {
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement
    const onKey = (e) => e.key === 'Escape' && fn()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [active, fn])
}

export function Dialog({ open, onClose, title, lead, children, labelledBy }) {
  const ref = useRef(null)
  const id = useId()
  useEscape(open, onClose)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => ref.current?.querySelector('input, textarea, .df .btn:last-child')?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy || id}>
        {title ? (
          <>
            <div className="dh">
              <h2 id={id}>{title}</h2>
              <IconButton icon={X} label="Fechar" onClick={onClose} />
            </div>
            {lead ? <p className="dlead">{lead}</p> : null}
          </>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  )
}

export function useAnimatedNumber(value, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || start === value) {
      from.current = value
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    let raf
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      const v = start + (value - start) * (1 - Math.pow(1 - p, 3))
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('pt-BR') }) {
  const shown = useAnimatedNumber(value)
  return (
    <span className="num" aria-label={format(value)}>
      {format(shown)}
    </span>
  )
}

export function useCompact(query = '(max-width: 640px)') {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
