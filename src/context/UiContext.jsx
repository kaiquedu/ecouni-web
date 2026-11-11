import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { Button, Dialog } from '../components/ui'

const ToastContext = createContext(() => {})
const ConfirmContext = createContext(null)

export function UiProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [confirmState, setConfirmState] = useState(null)
  const timer = useRef(null)
  const resolver = useRef(null)

  const show = useCallback((message, kind = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, kind, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setConfirmState({ cancelLabel: 'Cancelar', confirmLabel: 'Confirmar', ...opts })
      }),
    []
  )

  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setConfirmState(null)
  }

  const c = confirmState
  const Icon = c?.destructive ? AlertTriangle : HelpCircle

  return (
    <ToastContext.Provider value={show}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <Dialog open={!!c} onClose={() => close(false)} labelledBy="confirm-title">
          {c ? (
            <>
              <span className="dialog-icon" style={{ background: c.destructive ? 'var(--danger-soft)' : 'var(--navy-soft)', color: c.destructive ? 'var(--danger)' : 'var(--navy)' }}>
                <Icon size={24} aria-hidden />
              </span>
              <h2 className="h2" id="confirm-title">
                {c.title}
              </h2>
              {c.message ? (
                <p className="muted" style={{ fontSize: 15, marginTop: 6, color: 'var(--text-2)' }}>
                  {c.message}
                </p>
              ) : null}
              <div className="dialog-actions">
                <Button variant="outline" onClick={() => close(false)}>
                  {c.cancelLabel}
                </Button>
                <Button className={c.destructive ? 'btn-solid-danger' : ''} onClick={() => close(true)}>
                  {c.confirmLabel}
                </Button>
              </div>
            </>
          ) : null}
        </Dialog>
        {toast ? (
          <div key={toast.id} className="toast" role="status" aria-live="polite">
            {toast.kind === 'error' ? <AlertCircle size={18} color="#FFB4AE" /> : <CheckCircle2 size={18} color="#8FE0B8" />}
            {toast.message}
          </div>
        ) : null}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export const useConfirm = () => useContext(ConfirmContext)
