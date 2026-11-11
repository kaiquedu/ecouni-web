import { useCallback, useMemo, useState } from 'react'
import { Download, Pencil, Search, Trash2 } from 'lucide-react'
import ColetaDrawer from '../components/ColetaDrawer'
import { Button, Dot, EmptyState, ErrorState, Field, IconButton, Seg, Skeleton, TypeBar } from '../components/ui'
import { useColetas } from '../context/ColetasContext'
import { useConfirm, useToast } from '../context/UiContext'
import { WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { addDays, formatDate, formatLitros, formatTime, isSameDay, litros, parseDate, startOfDay, totalsByType } from '../lib/format'
import { colaboradores } from '../lib/report'
import { exportCsv } from '../lib/export'

const STEP = 40
const TYPES = [{ value: '', label: 'Todos' }, ...WASTE_ORDER.map((k) => ({ value: k, label: WASTE_TYPES[k].label }))]
const WEEK = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const dayLabel = (d) => {
  const now = new Date()
  if (isSameDay(d, now)) return `Hoje, ${formatDate(d)}`
  if (isSameDay(d, addDays(now, -1))) return `Ontem, ${formatDate(d)}`
  const w = WEEK[d.getDay()]
  return `${w.charAt(0).toUpperCase() + w.slice(1)}, ${formatDate(d)}`
}

export default function Coletas() {
  const { coletas, status, error, reload, remove } = useColetas()
  const toast = useToast()
  const confirm = useConfirm()
  const [tipo, setTipo] = useState('')
  const [pessoa, setPessoa] = useState('')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(STEP)
  const [editing, setEditing] = useState(null)
  const close = useCallback(() => setEditing(null), [])

  const people = useMemo(() => colaboradores(coletas), [coletas])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return coletas.filter((c) => {
      const t = wasteFromValue(c.TipoResiduo)
      if (tipo && t.key !== tipo) return false
      if (pessoa && c.NomeColaborador !== pessoa) return false
      if (!s) return true
      return [t.longLabel, c.Observacoes, c.NomeColaborador, formatDate(parseDate(c.DataRegistro))].some((v) => v && v.toLowerCase().includes(s))
    })
  }, [coletas, tipo, pessoa, q])

  const groups = useMemo(() => {
    const out = []
    const idx = {}
    list.slice(0, limit).forEach((c) => {
      const d = startOfDay(parseDate(c.DataRegistro))
      const k = d.getTime()
      if (!idx[k]) {
        idx[k] = { key: k, date: d, items: [] }
        out.push(idx[k])
      }
      idx[k].items.push(c)
    })
    return out.map((g) => ({ ...g, totals: totalsByType(g.items) }))
  }, [list, limit])

  const reset = (fn) => (v) => {
    fn(v)
    setLimit(STEP)
  }

  const del = async (c) => {
    const t = wasteFromValue(c.TipoResiduo)
    const ok = await confirm({ title: 'Excluir coleta?', message: `${t.longLabel}, ${formatLitros(litros(c))}, registrada por ${c.NomeColaborador}. Essa ação não pode ser desfeita.`, confirmLabel: 'Excluir', destructive: true })
    if (!ok) return
    try {
      await remove(c)
      toast('Coleta excluída.')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const clear = () => {
    setTipo('')
    setPessoa('')
    setQ('')
  }

  return (
    <>
      <header className="ph">
        <div>
          <h1>Coletas</h1>
          <p>Tudo o que os colaboradores registraram no app</p>
        </div>
        <Button variant="s" icon={Download} onClick={() => exportCsv(list)} disabled={!list.length}>
          Exportar CSV
        </Button>
      </header>

      <div className="card">
        <div className="toolbar">
          <Field small icon={Search} placeholder="Buscar por tipo, pessoa, data ou observação" value={q} onChange={(e) => reset(setQ)(e.target.value)} aria-label="Buscar coletas" />
          <Seg label="Tipo de resíduo" options={TYPES} value={tipo} onChange={reset(setTipo)} />
          <select className="sel" value={pessoa} onChange={(e) => reset(setPessoa)(e.target.value)} aria-label="Colaborador">
            <option value="">Todos os colaboradores</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {status === 'loading' ? (
          <div style={{ display: 'grid', gap: 12, padding: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} h={28} />
            ))}
          </div>
        ) : status === 'error' ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Search}
            title={coletas.length ? 'Nenhuma coleta encontrada' : 'Nenhuma coleta registrada'}
            message={coletas.length ? 'Nada corresponde à busca e aos filtros escolhidos.' : 'As coletas aparecem aqui assim que forem registradas pelo app.'}
            action={coletas.length ? 'Limpar filtros' : undefined}
            onAction={clear}
          />
        ) : (
          <>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 88 }}>Hora</th>
                    <th>Tipo</th>
                    <th>Colaborador</th>
                    <th>Saco × qtd</th>
                    <th className="r">Total</th>
                    <th style={{ width: 88 }}>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <GroupRows key={g.key} group={g} onEdit={setEditing} onDelete={del} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tfoot">
              <span className="num">
                {Math.min(limit, list.length)} de {list.length} coletas
              </span>
              {limit < list.length ? (
                <Button variant="s" onClick={() => setLimit((l) => l + STEP)}>
                  Carregar mais
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
      <ColetaDrawer key={editing?.Id} coleta={editing} onClose={close} />
    </>
  )
}

function GroupRows({ group, onEdit, onDelete }) {
  return (
    <>
      <tr className="grp">
        <td colSpan={6}>
          <div className="grp-in">
            {dayLabel(group.date)}
            <TypeBar totals={group.totals} />
            <em className="num">{formatLitros(group.totals.total)}</em>
          </div>
        </td>
      </tr>
      {group.items.map((c) => {
        const t = wasteFromValue(c.TipoResiduo)
        const d = parseDate(c.DataRegistro)
        return (
          <tr key={c.Id}>
            <td className="num muted">{formatTime(d)}</td>
            <td>
              <span className="tag">
                <Dot type={t} />
                {t.longLabel}
              </span>
              {c.Observacoes ? (
                <div className="obs" title={c.Observacoes}>
                  {c.Observacoes}
                </div>
              ) : null}
            </td>
            <td>{c.NomeColaborador}</td>
            <td className="num muted">
              {c.TamanhoSaco} L × {c.Quantidade}
            </td>
            <td className="num r" style={{ fontWeight: 600 }}>
              {formatLitros(litros(c))}
            </td>
            <td>
              <div className="row-acts">
                <IconButton icon={Pencil} label={`Editar coleta das ${formatTime(d)}`} onClick={() => onEdit(c)} />
                <IconButton icon={Trash2} label={`Excluir coleta das ${formatTime(d)}`} danger onClick={() => onDelete(c)} />
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}
