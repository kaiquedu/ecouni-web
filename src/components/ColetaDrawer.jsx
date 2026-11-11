import { useCallback, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { Button, Field, IconButton, Seg, useEscape } from './ui'
import { BAG_SIZES, WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { formatLitros, parseDate, toInputDateTime, toLocalIso } from '../lib/format'
import { useColetas } from '../context/ColetasContext'
import { useConfirm, useToast } from '../context/UiContext'

const toForm = (c) => ({
  tipo: wasteFromValue(c.TipoResiduo).key,
  saco: c.TamanhoSaco,
  quantidade: c.Quantidade,
  data: toInputDateTime(parseDate(c.DataRegistro)),
  observacoes: c.Observacoes || '',
})

export default function ColetaDrawer({ coleta, onClose }) {
  const { update, remove } = useColetas()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(() => (coleta ? toForm(coleta) : null))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [maxDate] = useState(() => toInputDateTime(new Date()))
  const close = useCallback(() => !saving && !deleting && onClose(), [saving, deleting, onClose])
  useEscape(!!coleta, close)

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
    const t = wasteFromValue(coleta.TipoResiduo)
    const ok = await confirm({
      title: 'Excluir coleta?',
      message: `${t.longLabel}, ${formatLitros(coleta.TamanhoSaco * coleta.Quantidade)}, registrada por ${coleta.NomeColaborador}. Essa ação não pode ser desfeita.`,
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
    <div className="overlay drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="drawer" role="dialog" aria-modal="true" aria-labelledby="dw-t" onSubmit={save}>
        <div className="drawer-b">
          <div className="dh">
            <h2 id="dw-t">Editar coleta</h2>
            <IconButton icon={X} label="Fechar" onClick={close} />
          </div>
          <p className="dlead">Registrada por {coleta.NomeColaborador}</p>

          <div className="stack">
            <div className="fld">
              <span className="fld-l">Tipo de resíduo</span>
              <Seg full label="Tipo de resíduo" options={WASTE_ORDER.map((k) => ({ value: k, label: WASTE_TYPES[k].label }))} value={form.tipo} onChange={(tipo) => set({ tipo })} />
            </div>
            <div className="fld">
              <span className="fld-l" id="dw-saco">
                Tamanho do saco
              </span>
              <div className="sizes" role="radiogroup" aria-labelledby="dw-saco">
                {sizes.map((s) => (
                  <button key={s} type="button" className="size" role="radio" aria-checked={form.saco === s} onClick={() => set({ saco: s })}>
                    {s} L
                  </button>
                ))}
              </div>
            </div>
            <div className="fld">
              <span className="fld-l">Quantidade de sacos</span>
              <div className="stepper">
                <IconButton icon={Minus} label="Diminuir" disabled={form.quantidade <= 1} onClick={() => set({ quantidade: Math.max(1, form.quantidade - 1) })} />
                <b className="num" aria-live="polite">
                  {form.quantidade}
                </b>
                <IconButton icon={Plus} label="Aumentar" onClick={() => set({ quantidade: Math.min(99, form.quantidade + 1) })} />
              </div>
            </div>
            <Field label="Data e hora" type="datetime-local" value={form.data} max={maxDate} onChange={(e) => set({ data: e.target.value })} required />
            <Field label="Observações" optional="opcional" multiline value={form.observacoes} maxLength={500} placeholder="Ex.: coletado no bloco B" onChange={(e) => set({ observacoes: e.target.value })} />
            <div className="total">
              <span>Total</span>
              <b className="num">{formatLitros(form.saco * form.quantidade)}</b>
            </div>
          </div>
        </div>
        <div className="drawer-f">
          <Button variant="ds" onClick={del} loading={deleting} disabled={saving}>
            Excluir
          </Button>
          <Button type="submit" loading={saving} disabled={deleting}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
