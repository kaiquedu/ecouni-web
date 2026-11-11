import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { Eye, EyeOff, Inbox, Info, Recycle, WifiOff, X } from 'lucide-react'
import { initials } from '../lib/format'

export function Button({ children, variant = 'primary', size, loading, disabled, icon: Icon, className = '', ...props }) {
  const cls = ['btn', variant !== 'primary' && `btn-${variant}`, size && `btn-${size}`, !children && 'btn-icon', className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="spinner" aria-hidden /> : Icon ? <Icon size={18} aria-hidden /> : null}
      {children}
    </button>
  )
}

export const Field = forwardRef(function Field(
  { label, optional, icon: Icon, error, hint, type = 'text', multiline, select, children, value, className = '', ...props },
  ref
) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const Tag = multiline ? 'textarea' : select ? 'select' : 'input'
  return (
    <div className={`field ${className}`}>
      {label ? (
        <label className="field-label" htmlFor={id}>
          {label} {optional ? <em>{optional}</em> : null}
        </label>
      ) : null}
      <div className={`input-wrap${value ? ' filled' : ''}${error ? ' error' : ''}`}>
        {Icon ? <Icon size={18} aria-hidden /> : null}
        <Tag
          ref={ref}
          id={id}
          type={isPassword && show ? 'text' : select || multiline ? undefined : type}
          value={value}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          {...props}
        >
          {children}
        </Tag>
        {isPassword ? (
          <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <span id={`${id}-msg`} className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-msg`} className="field-hint">
          {hint}
        </span>
      ) : null}
    </div>
  )
})

export function Chip({ children, on, tone, icon: Icon, ...props }) {
  const style = tone ? { background: tone.bg, color: tone.fg } : undefined
  return (
    <button type="button" className={`chip${tone ? ` tone${on ? '' : ' off'}` : on ? ' on' : ''}`} aria-pressed={!!on} style={style} {...props}>
      {Icon ? <Icon size={14} aria-hidden /> : null}
      {children}
    </button>
  )
}

export function Segmented({ options, value, onChange, label }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW((el.clientWidth - 6 - 3 * (options.length - 1)) / options.length))
    ro.observe(el)
    return () => ro.disconnect()
  }, [options.length])
  return (
    <div className="segmented" role="tablist" aria-label={label} ref={ref}>
      {w ? <span className="segmented-pill" style={{ width: w, transform: `translateX(${index * (w + 3)}px)` }} aria-hidden /> : null}
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Brand({ size = 36, word = 18, onDark = false }) {
  return (
    <span className="brand" style={{ fontSize: word, color: onDark ? '#fff' : undefined }} aria-label="EcoUni">
      <span className="brand-mark" style={{ width: size, height: size, borderRadius: size * 0.3, background: onDark ? '#fff' : undefined, color: onDark ? 'var(--navy)' : undefined }}>
        <Recycle size={size * 0.56} aria-hidden />
      </span>
      <span aria-hidden style={{ color: onDark ? '#fff' : 'var(--navy)' }}>
        ECO<span style={{ color: onDark ? '#9cc3ea' : undefined }}>U</span>NI
      </span>
    </span>
  )
}

export const WasteIcon = ({ type, size = 40, icon: Icon }) => (
  <span className="waste-icon" style={{ width: size, height: size, background: type.bg, color: type.fg }} aria-hidden>
    <Icon size={size * 0.5} />
  </span>
)

export const Tag = ({ type, icon: Icon }) => (
  <span className="tag" style={{ background: type.bg, color: type.fg }}>
    {Icon ? <Icon size={14} aria-hidden /> : null}
    {type.longLabel}
  </span>
)

export const Avatar = ({ name, size = 40, dark }) => (
  <span className={`avatar${dark ? ' dark' : ''}`} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden>
    {initials(name)}
  </span>
)

export const Skeleton = ({ h = 16, w = '100%', r, style }) => <span className="skeleton" style={{ display: 'block', height: h, width: w, borderRadius: r, ...style }} aria-hidden />

export function EmptyState({ icon: Icon = Inbox, title, message, action, onAction }) {
  return (
    <div className="state">
      <span className="state-icon">
        <Icon size={26} aria-hidden />
      </span>
      <p className="h3">{title}</p>
      {message ? <p className="muted">{message}</p> : null}
      {action ? (
        <Button variant="outline" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  )
}

export const ErrorState = ({ message, onRetry }) => <EmptyState icon={WifiOff} title="Não foi possível carregar" message={message} action="Tentar novamente" onAction={onRetry} />

export const InfoBox = ({ children, icon: Icon = Info }) => (
  <div className="info">
    <Icon size={18} aria-hidden />
    <span>{children}</span>
  </div>
)

export function Dialog({ open, onClose, title, children, wide, labelledBy }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => ref.current?.querySelector('input, select, textarea, button:not([aria-label="Fechar"])')?.focus(), 30)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`dialog${wide ? ' dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || id}>
        {title ? (
          <div className="dialog-head">
            <h2 className="h2" id={id}>
              {title}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
              <X size={22} color="var(--ink)" />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function useAnimatedNumber(value, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = from.current
    if (reduce || start === value) {
      from.current = value
      setShown(value)
      return
    }
    let raf
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      const v = start + (value - start) * e
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('pt-BR'), ...props }) {
  const shown = useAnimatedNumber(value)
  return (
    <span aria-label={format(value)} {...props}>
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
