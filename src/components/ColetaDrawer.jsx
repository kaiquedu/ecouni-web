import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { Button, Field, Segmented } from './ui'
import { BAG_SIZES, WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { formatLitros, parseDate, toInputDateTime, toLocalIso } from '../lib/format'
import { useColetas } from '../context/ColetasContext'
import { useConfirm, useToast } from '../context/UiContext'

export default function ColetaDrawer({ coleta, onClose }) {
  const { update, remove } = useColetas()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!coleta) return
    setForm({
      tipo: wasteFromValue(coleta.TipoResiduo).key,
      saco: coleta.TamanhoSaco,
      quantidade: coleta.Quantidade,
      data: toInputDateTime(parseDate(coleta.DataRegistro)),
      observacoes: coleta.Observacoes || '',
    })
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [coleta, onClose])

  if (!coleta || !form) return null
  const sizes = BAG_SIZES.includes(coleta.TamanhoSaco) ? BAG_SIZES : [...BAG_SIZES, coleta.TamanhoSaco].sort((a, b) => a - b)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await update(coleta, {
        TipoResiduo: WASTE_TYPES[form.tipo].value,
        TamanhoSaco: form.saco,
        Quantidade: form.quantidade,
        Observacoes: form.observacoes,
        DataRegistro: toLocalIso(new Date(form.data)),
      })
      toast('Alterações salvas.')
      onClose()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    const ok = await confirm({
      title: 'Excluir coleta?',
      message: `${wasteFromValue(coleta.TipoResiduo).longLabel} de ${formatLitros(coleta.TamanhoSaco * coleta.Quantidade)}, registrada por ${coleta.NomeColaborador}. Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await remove(coleta)
      toast('Coleta excluída.')
      onClose()
    } catch (err) {
      toast(err.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onSubmit={save}>
        <div className="dialog-head">
          <h2 className="h2" id="drawer-title">
            Editar coleta
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={22} color="var(--ink)" />
          </button>
        </div>
        <p className="muted">Registrada por {coleta.NomeColaborador}</p>

        <div className="form-stack">
          <div className="field">
            <span className="field-label">Tipo de resíduo</span>
            <Segmented label="Tipo de resíduo" options={WASTE_ORDER.map((k) => ({ value: k, label: WASTE_TYPES[k].label }))} value={form.tipo} onChange={(tipo) => set({ tipo })} />
          </div>

          <div className="field">
            <span className="field-label" id="saco-label">
              Tamanho do saco
            </span>
            <div className="grid-sizes" role="radiogroup" aria-labelledby="saco-label">
              {sizes.map((s) => (
                <button key={s} type="button" className="size" role="radio" aria-checked={form.saco === s} onClick={() => set({ saco: s })}>
                  {s} L
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Quantidade de sacos</span>
            <div className="stepper">
              <button type="button" onClick={() => set({ quantidade: Math.max(1, form.quantidade - 1) })} disabled={form.quantidade <= 1} aria-label="Diminuir">
                <Minus size={18} />
              </button>
              <b aria-live="polite">{form.quantidade}</b>
              <button type="button" onClick={() => set({ quantidade: Math.min(99, form.quantidade + 1) })} aria-label="Aumentar">
                <Plus size={18} />
              </button>
            </div>
          </div>

          <Field label="Data e hora" type="datetime-local" value={form.data} max={toInputDateTime(new Date())} onChange={(e) => set({ data: e.target.value })} required />
          <Field label="Observações" optional="opcional" multiline value={form.observacoes} maxLength={500} placeholder="Ex.: coletado no bloco B" onChange={(e) => set({ observacoes: e.target.value })} />

          <div className="info" style={{ justifyContent: 'space-between' }}>
            <span>Total</span>
            <b style={{ fontSize: 16 }}>{formatLitros(form.saco * form.quantidade)}</b>
          </div>
        </div>

        <div className="dialog-actions stack">
          <Button type="submit" size="lg" loading={saving}>
            Salvar alterações
          </Button>
          <Button variant="danger" onClick={del} loading={deleting}>
            Excluir coleta
          </Button>
        </div>
      </form>
    </div>
  )
}
