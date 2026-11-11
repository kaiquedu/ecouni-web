import { useMemo, useState } from 'react'
import { Download, FileDown } from 'lucide-react'
import StackedBars from '../components/StackedBars'
import { AnimatedNumber, Button, Dot, EmptyState, ErrorState, Seg, Skeleton, TypeBar, useCompact } from '../components/ui'
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
const GRAN_TEXT = { dia: 'dia', semana: 'semana', mes: 'mês' }

export default function Relatorios() {
  const { coletas, status, error, reload } = useColetas()
  const toast = useToast()
  const compact = useCompact()
  const [f, setF] = useState(defaultFilters)
  const [gran, setGran] = useState('dia')
  const [summary, setSummary] = useState(true)
  const [listOn, setListOn] = useState(true)
  const [busy, setBusy] = useState(false)
  const [maxDate] = useState(() => toInputDate(new Date()))

  const list = useMemo(() => applyFilters(coletas, f), [coletas, f])
  const sum = useMemo(() => summarize(list), [list])
  const bars = useMemo(() => buckets(list, f, gran, compact ? 7 : 14), [list, f, gran, compact])
  const rank = useMemo(() => ranking(list), [list])
  const people = useMemo(() => colaboradores(coletas), [coletas])
  const set = (patch) => setF((s) => ({ ...s, ...patch }))
  const loading = status === 'loading'

  const toggleType = (k) =>
    setF((s) => {
      const has = s.types.includes(k)
      if (has && s.types.length === 1) return s
      return { ...s, types: has ? s.types.filter((t) => t !== k) : [...s.types, k] }
    })

  const pdf = async () => {
    setBusy(true)
    try {
      await exportPdf({ list, filters: f, granularity: gran, includeSummary: summary, includeList: listOn })
      toast('PDF gerado.')
    } catch {
      toast('Não foi possível gerar o PDF. Tente novamente.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const animKey = `${gran}|${periodLabel(f)}|${f.types.join()}|${f.colaborador}|${compact}`

  return (
    <>
      <header className="ph">
        <div>
          <h1>Relatórios</h1>
          <p className="num">
            {periodLabel(f)}, {sum.count} {sum.count === 1 ? 'coleta' : 'coletas'}
            {f.colaborador ? ` de ${f.colaborador}` : ''}
          </p>
        </div>
        <div className="acts">
          <Button variant="s" icon={Download} onClick={() => exportCsv(list)} disabled={!list.length}>
            Baixar CSV
          </Button>
          <Button icon={FileDown} onClick={pdf} loading={busy} disabled={!list.length || (!summary && !listOn)}>
            Exportar PDF
          </Button>
        </div>
      </header>

      <div className="card filters">
        <div className="fg">
          <span className="fg-l">Período</span>
          <Seg label="Período" options={PERIODS} value={f.period} onChange={(period) => set({ period })} />
        </div>
        {f.period === 'custom' ? (
          <div className="fg">
            <span className="fg-l">Intervalo</span>
            <div className="fg-dates">
              <input type="date" aria-label="Data inicial" value={toInputDate(f.from)} max={maxDate} onChange={(e) => e.target.value && set({ from: fromInputDate(e.target.value) })} />
              <input type="date" aria-label="Data final" value={toInputDate(f.to)} max={maxDate} onChange={(e) => e.target.value && set({ to: fromInputDate(e.target.value) })} />
            </div>
          </div>
        ) : null}
        <div className="fg">
          <span className="fg-l">Tipo de resíduo</span>
          <div className="chks">
            {WASTE_ORDER.map((k) => (
              <label key={k} className="chk">
                <input type="checkbox" checked={f.types.includes(k)} onChange={() => toggleType(k)} />
                <Dot type={WASTE_TYPES[k]} />
                {WASTE_TYPES[k].label}
              </label>
            ))}
          </div>
        </div>
        <div className="fg">
          <span className="fg-l">Colaborador</span>
          <select className="sel" value={f.colaborador} onChange={(e) => set({ colaborador: e.target.value })} aria-label="Colaborador">
            <option value="">Todos os colaboradores</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <button className="linkbtn" type="button" onClick={() => setF(defaultFilters())}>
          Limpar filtros
        </button>
      </div>

      {status === 'error' ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="card stat">
              <span>Volume total</span>
              {loading ? <Skeleton h={34} w="60%" style={{ marginTop: 4 }} /> : <strong><AnimatedNumber value={sum.totals.total} format={formatLitros} /></strong>}
              <TypeBar totals={sum.totals} />
            </div>
            <div className="card stat">
              <span>Reciclado</span>
              {loading ? <Skeleton h={34} w="40%" style={{ marginTop: 4 }} /> : <strong style={{ color: 'var(--success)' }}><AnimatedNumber value={sum.reciclado * 100} format={(n) => `${Math.round(n)}%`} /></strong>}
              <small className="num">{formatLitros(sum.totals.reciclavel + sum.totals.papel)} reaproveitáveis</small>
            </div>
            <div className="card stat">
              <span>Coletas</span>
              {loading ? <Skeleton h={34} w="30%" style={{ marginTop: 4 }} /> : <strong><AnimatedNumber value={sum.count} /></strong>}
              <small>
                {rank.length} {rank.length === 1 ? 'colaborador' : 'colaboradores'}
              </small>
            </div>
            <div className="card stat">
              <span>Média por coleta</span>
              {loading ? <Skeleton h={34} w="40%" style={{ marginTop: 4 }} /> : <strong><AnimatedNumber value={sum.count ? sum.totals.total / sum.count : 0} format={formatLitros} /></strong>}
              <small>Tamanho do saco × quantidade</small>
            </div>
          </div>

          <div className="grid">
            <section className="card flexcard" aria-labelledby="r-ch">
              <div className="card-h">
                <h2 id="r-ch">Volume por tipo</h2>
                <Seg label="Agrupar por" options={GRAN} value={gran} onChange={setGran} />
              </div>
              {loading ? (
                <div className="chart">
                  <Skeleton h="100%" style={{ minHeight: 260 }} />
                </div>
              ) : sum.count === 0 ? (
                <EmptyState title="Sem coletas no período" message="Ajuste o período ou os filtros para ver o resumo." action="Limpar filtros" onAction={() => setF(defaultFilters())} />
              ) : (
                <>
                  <StackedBars data={bars} animKey={animKey} />
                  <ul className="tot">
                    {WASTE_ORDER.filter((k) => f.types.includes(k)).map((k) => (
                      <li key={k}>
                        <span>
                          <Dot type={WASTE_TYPES[k]} />
                          {WASTE_TYPES[k].label}
                        </span>
                        <b>
                          <AnimatedNumber value={sum.totals[k]} format={formatLitros} />
                        </b>
                        <span className="muted r num">{sum.pct(k)}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <div className="col">
              <section className="card grow" aria-labelledby="r-rk">
                <div className="card-h">
                  <h2 id="r-rk">Por colaborador</h2>
                </div>
                {rank.length === 0 ? (
                  <p className="muted" style={{ padding: '12px 20px 20px' }}>
                    Ninguém coletou no período.
                  </p>
                ) : (
                  <ul className="rank">
                    {rank.map((r, i) => (
                      <li key={r.nome} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                        <div className="r1">
                          <span>{r.nome}</span>
                          <span className="num">{formatLitros(r.litros)}</span>
                        </div>
                        <div className="r2">
                          <span>
                            {r.coletas} {r.coletas === 1 ? 'coleta' : 'coletas'}
                          </span>
                          <span className="num">{Math.round((r.litros / sum.totals.total) * 100)}%</span>
                        </div>
                        <div className="track">
                          <div className="cb" style={{ width: `${(r.litros / rank[0].litros) * 100}%` }}>
                            {WASTE_ORDER.map((k) => (r.totals[k] > 0 ? <i key={k} style={{ flexGrow: r.totals[k], background: WASTE_TYPES[k].color }} /> : null))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card" aria-labelledby="r-pdf">
                <div className="card-h">
                  <h2 id="r-pdf">Incluir no PDF</h2>
                </div>
                <div style={{ padding: '0 20px 4px' }}>
                  <label className="opt">
                    <div>
                      <b>Resumo e gráfico</b>
                      <span>Totais por tipo e barras por {GRAN_TEXT[gran]}</span>
                    </div>
                    <span className="sw">
                      <input type="checkbox" role="switch" checked={summary} onChange={(e) => setSummary(e.target.checked)} />
                    </span>
                  </label>
                  <label className="opt">
                    <div>
                      <b>Lista de coletas</b>
                      <span className="num">
                        {list.length} {list.length === 1 ? 'coleta' : 'coletas'} no período
                      </span>
                    </div>
                    <span className="sw">
                      <input type="checkbox" role="switch" checked={listOn} onChange={(e) => setListOn(e.target.checked)} />
                    </span>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  )
}
