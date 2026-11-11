import { useCallback, useMemo, useState } from 'react'
import { Download, Pencil, Search, Trash2 } from 'lucide-react'
import ColetaDrawer from '../components/ColetaDrawer'
import { Button, Chip, EmptyState, ErrorState, Field, Skeleton, Tag } from '../components/ui'
import { WASTE_ICONS } from '../components/waste'
import { useColetas } from '../context/ColetasContext'
import { useConfirm, useToast } from '../context/UiContext'
import { WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { formatDate, formatLitros, formatTime, litros, parseDate } from '../lib/format'
import { colaboradores } from '../lib/report'
import { exportCsv } from '../lib/export'

const PAGE = 15

export default function Coletas() {
  const { coletas, status, error, reload, remove } = useColetas()
  const toast = useToast()
  const confirm = useConfirm()
  const [tipo, setTipo] = useState('todos')
  const [pessoa, setPessoa] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const close = useCallback(() => setEditing(null), [])

  const people = useMemo(() => colaboradores(coletas), [coletas])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return coletas.filter((c) => {
      const t = wasteFromValue(c.TipoResiduo)
      if (tipo !== 'todos' && t.key !== tipo) return false
      if (pessoa && c.NomeColaborador !== pessoa) return false
      if (!s) return true
      return [t.longLabel, c.Observacoes, c.NomeColaborador, formatDate(parseDate(c.DataRegistro))].some((v) => v && v.toLowerCase().includes(s))
    })
  }, [coletas, tipo, pessoa, q])

  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const current = Math.min(page, pages - 1)
  const rows = list.slice(current * PAGE, current * PAGE + PAGE)
  const resetPage = (fn) => (v) => {
    fn(v)
    setPage(0)
  }

  const del = async (c) => {
    const t = wasteFromValue(c.TipoResiduo)
    const ok = await confirm({ title: 'Excluir coleta?', message: `${t.longLabel} de ${formatLitros(litros(c))}, registrada por ${c.NomeColaborador}. Essa ação não pode ser desfeita.`, confirmLabel: 'Excluir', destructive: true })
    if (!ok) return
    try {
      await remove(c)
      toast('Coleta excluída.')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Coletas</h1>
          <p className="muted">Todas as coletas registradas pelos colaboradores no app.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={Download} onClick={() => exportCsv(list)} disabled={!list.length}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <section className="card">
        <div className="toolbar">
          <Field icon={Search} placeholder="Buscar por tipo, pessoa, data ou observação" value={q} onChange={(e) => resetPage(setQ)(e.target.value)} aria-label="Buscar coletas" style={{ flex: 1 }} className="grow" />
          <Field select value={pessoa} onChange={(e) => resetPage(setPessoa)(e.target.value)} aria-label="Filtrar por colaborador">
            <option value="">Todos os colaboradores</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Field>
        </div>
        <div className="chips" style={{ marginBottom: 12 }}>
          <Chip on={tipo === 'todos'} onClick={() => resetPage(setTipo)('todos')}>
            Todos
          </Chip>
          {WASTE_ORDER.map((k) => (
            <Chip key={k} on={tipo === k} onClick={() => resetPage(setTipo)(k)}>
              {WASTE_TYPES[k].label}
            </Chip>
          ))}
        </div>

        {status === 'loading' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} h={36} />
            ))}
          </div>
        ) : status === 'error' ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Search}
            title={coletas.length ? 'Nada encontrado' : 'Nenhuma coleta registrada'}
            message={coletas.length ? 'Nenhuma coleta corresponde aos filtros.' : 'As coletas aparecem aqui quando forem registradas pelo app.'}
            action={coletas.length ? 'Limpar filtros' : undefined}
            onAction={() => {
              setTipo('todos')
              setPessoa('')
              setQ('')
            }}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Colaborador</th>
                    <th>Saco × qtd</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Observações</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const t = wasteFromValue(c.TipoResiduo)
                    const d = parseDate(c.DataRegistro)
                    return (
                      <tr key={c.Id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <b>{formatDate(d)}</b> <span className="muted">{formatTime(d)}</span>
                        </td>
                        <td>
                          <Tag type={t} icon={WASTE_ICONS[t.key]} />
                        </td>
                        <td>{c.NomeColaborador}</td>
                        <td className="muted">
                          {c.TamanhoSaco} L × {c.Quantidade}
                        </td>
                        <td className="num">{formatLitros(litros(c))}</td>
                        <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.Observacoes || ''}>
                          {c.Observacoes || '—'}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(c)} aria-label={`Editar coleta de ${formatDate(d)}`} />
                            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => del(c)} aria-label={`Excluir coleta de ${formatDate(d)}`} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="small">
                {current * PAGE + 1}–{Math.min(list.length, (current + 1) * PAGE)} de {list.length} coletas
              </span>
              <div className="page-actions">
                <Button variant="outline" size="sm" onClick={() => setPage(current - 1)} disabled={current === 0}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      <ColetaDrawer coleta={editing} onClose={close} />
    </>
  )
}
