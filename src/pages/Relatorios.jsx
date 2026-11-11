import { useMemo, useState } from 'react'
import { Check, Download, FileDown } from 'lucide-react'
import StackedBars from '../components/StackedBars'
import { AnimatedNumber, useCompact, Button, Chip, EmptyState, ErrorState, Field, Segmented, Skeleton } from '../components/ui'
import { useColetas } from '../context/ColetasContext'
import { useToast } from '../context/UiContext'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import { formatLitros, fromInputDate, toInputDate } from '../lib/format'
import { PERIODS, applyFilters, buckets, colaboradores, defaultFilters, periodLabel, ranking, summarize } from '../lib/report'
import { exportCsv, exportPdf } from '../lib/export'

const GRAN = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

export default function Relatorios() {
  const { coletas, status, error, reload } = useColetas()
  const toast = useToast()
  const [f, setF] = useState(defaultFilters)
  const [gran, setGran] = useState('dia')
  const compact = useCompact()
  const [summary, setSummary] = useState(true)
  const [listOn, setListOn] = useState(true)
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => applyFilters(coletas, f), [coletas, f])
  const sum = useMemo(() => summarize(list), [list])
  const bars = useMemo(() => buckets(list, f, gran, compact ? 7 : 14), [list, f, gran, compact])
  const rank = useMemo(() => ranking(list), [list])
  const people = useMemo(() => colaboradores(coletas), [coletas])
  const set = (patch) => setF((s) => ({ ...s, ...patch }))

  const toggleType = (k) =>
    setF((s) => {
      const has = s.types.includes(k)
      if (has && s.types.length === 1) return s
      return { ...s, types: has ? s.types.filter((t) => t !== k) : [...s.types, k] }
    })

  const pdf = async () => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 30))
    try {
      await exportPdf({ list, filters: f, granularity: gran, includeSummary: summary, includeList: listOn })
      toast('PDF gerado.')
    } catch {
      toast('Não foi possível gerar o PDF. Tente novamente.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const animKey = `${gran}|${periodLabel(f)}|${f.types.join()}|${f.colaborador}`

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Relatórios</h1>
          <p className="muted">
            {periodLabel(f)}
            {f.colaborador ? ` · ${f.colaborador}` : ''} · {sum.count} {sum.count === 1 ? 'coleta' : 'coletas'}
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={Download} onClick={() => exportCsv(list)} disabled={!list.length}>
            CSV
          </Button>
          <Button icon={FileDown} onClick={pdf} loading={busy} disabled={!list.length || (!summary && !listOn)}>
            Exportar PDF
          </Button>
        </div>
      </div>

      <section className="card" aria-label="Filtros" style={{ display: 'grid', gap: 16 }}>
        <div className="field">
          <span className="field-label">Período</span>
          <div className="chips">
            {PERIODS.map((p) => (
              <Chip key={p.value} on={f.period === p.value} onClick={() => set({ period: p.value })}>
                {p.label}
              </Chip>
            ))}
          </div>
          {f.period === 'custom' ? (
            <div className="dates" style={{ marginTop: 6 }}>
              <Field label="De" type="date" value={toInputDate(f.from)} max={toInputDate(new Date())} onChange={(e) => e.target.value && set({ from: fromInputDate(e.target.value) })} />
              <Field label="Até" type="date" value={toInputDate(f.to)} max={toInputDate(new Date())} onChange={(e) => e.target.value && set({ to: fromInputDate(e.target.value) })} />
            </div>
          ) : null}
        </div>
        <div className="filters-row">
          <div className="field">
            <span className="field-label">Tipo de resíduo</span>
            <div className="chips">
              {WASTE_ORDER.map((k) => {
                const on = f.types.includes(k)
                return (
                  <Chip key={k} tone={WASTE_TYPES[k]} on={on} icon={on ? Check : undefined} onClick={() => toggleType(k)}>
                    {WASTE_TYPES[k].label}
                  </Chip>
                )
              })}
            </div>
          </div>
          <Field label="Colaborador" select value={f.colaborador} onChange={(e) => set({ colaborador: e.target.value })} className="filters-select">
            <option value="">Todos os colaboradores</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Field>
          <Button variant="ghost" onClick={() => setF(defaultFilters())}>
            Limpar filtros
          </Button>
        </div>
      </section>

      {status === 'error' ? (
        <div className="card" style={{ marginTop: 16 }}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <>
          <div className="grid-kpi" style={{ marginTop: 16 }}>
            {[
              ['Volume total', sum.totals.total, formatLitros],
              ['Reciclado', sum.reciclado * 100, (n) => `${Math.round(n)}%`, 'var(--success)'],
              ['Coletas', sum.count],
              ['Média por coleta', sum.count ? sum.totals.total / sum.count : 0, formatLitros],
            ].map(([label, v, fmt, color]) => (
              <div key={label} className="kpi card" style={{ border: 0 }}>
                <span className="muted">{label}</span>
                {status === 'loading' ? <Skeleton h={32} w="60%" style={{ marginTop: 6 }} /> : <b style={{ color }}><AnimatedNumber value={v} format={fmt} /></b>}
              </div>
            ))}
          </div>

          <div className="grid-2">
            <section className="card" aria-labelledby="rep-chart">
              <div className="card-head">
                <h2 className="h3" id="rep-chart">
                  Volume por tipo
                </h2>
                <Segmented label="Agrupar por" options={GRAN} value={gran} onChange={setGran} />
              </div>
              {status === 'loading' ? (
                <Skeleton h={260} />
              ) : sum.count === 0 ? (
                <EmptyState title="Sem coletas no período" message="Ajuste o período ou os filtros para ver o resumo." action="Limpar filtros" onAction={() => setF(defaultFilters())} />
              ) : (
                <>
                  <StackedBars data={bars} animKey={animKey} />
                  <div className="legend">
                    {WASTE_ORDER.map((k) => (
                      <div key={k} className="legend-row">
                        <i style={{ background: WASTE_TYPES[k].color }} />
                        {WASTE_TYPES[k].label}
                        <b>
                          <AnimatedNumber value={sum.totals[k]} format={formatLitros} />
                        </b>
                        <span>{sum.pct(k)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="card" aria-labelledby="rep-rank">
                <h2 className="h3" id="rep-rank" style={{ marginBottom: 8 }}>
                  Por colaborador
                </h2>
                {rank.length === 0 ? (
                  <p className="muted">Nenhuma coleta no período.</p>
                ) : (
                  rank.map((r, i) => (
                    <div key={r.nome} className="list-row" style={{ display: 'block', animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <b>{r.nome}</b>
                        <strong>{formatLitros(r.litros)}</strong>
                      </div>
                      <span className="small">
                        {r.coletas} {r.coletas === 1 ? 'coleta' : 'coletas'}
                      </span>
                      <div className="rank-bar">
                        <span style={{ width: `${(r.litros / rank[0].litros) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="card" aria-labelledby="rep-pdf">
                <h2 className="h3" id="rep-pdf" style={{ marginBottom: 4 }}>
                  Incluir no PDF
                </h2>
                <Toggle label="Resumo e gráfico" hint={`Totais por tipo e barras por ${gran === 'mes' ? 'mês' : gran}`} value={summary} onChange={setSummary} />
                <Toggle label="Lista de coletas" hint={`${list.length} ${list.length === 1 ? 'coleta' : 'coletas'} no período`} value={listOn} onChange={setListOn} last />
              </section>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Toggle({ label, hint, value, onChange, last }) {
  return (
    <label className="list-row" style={{ cursor: 'pointer', borderBottom: last ? 0 : undefined }}>
      <div style={{ flex: 1 }}>
        <b>{label}</b>
        <span className="small">{hint}</span>
      </div>
      <input type="checkbox" role="switch" className="switch" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
