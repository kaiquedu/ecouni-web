import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Dialog } from '../components/ui'

const ToastContext = createContext(() => {})
const ConfirmContext = createContext(null)

export function UiProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [dlg, setDlg] = useState(null)
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
        setDlg({ cancelLabel: 'Cancelar', confirmLabel: 'Confirmar', ...opts })
      }),
    []
  )

  const close = useCallback((result) => {
    resolver.current?.(result)
    resolver.current = null
    setDlg(null)
  }, [])
  const cancel = useCallback(() => close(false), [close])

  return (
    <ToastContext.Provider value={show}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <Dialog open={!!dlg} onClose={cancel} labelledBy="cf-t">
          {dlg ? (
            <>
              <h2 id="cf-t" style={{ fontSize: 18, fontWeight: 600 }}>
                {dlg.title}
              </h2>
              {dlg.message ? <p style={{ marginTop: 8, color: 'var(--ink-2)' }}>{dlg.message}</p> : null}
              <div className="df">
                <Button variant="s" onClick={cancel}>
                  {dlg.cancelLabel}
                </Button>
                <Button variant={dlg.destructive ? 'd' : undefined} onClick={() => close(true)}>
                  {dlg.confirmLabel}
                </Button>
              </div>
            </>
          ) : null}
        </Dialog>
        {toast ? (
          <div key={toast.id} className="toast" role="status" aria-live="polite">
            {toast.kind === 'error' ? <AlertCircle size={16} color="#FCA5A5" aria-hidden /> : <CheckCircle2 size={16} color="#86EFAC" aria-hidden />}
            {toast.message}
          </div>
        ) : null}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export const useConfirm = () => useContext(ConfirmContext)
