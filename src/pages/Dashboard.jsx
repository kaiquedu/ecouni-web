import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StackedBars from '../components/StackedBars'
import { AnimatedNumber, useCompact, EmptyState, ErrorState, Segmented, Skeleton, WasteIcon } from '../components/ui'
import { WASTE_ICONS } from '../components/waste'
import { useAuth } from '../context/AuthContext'
import { useColetas } from '../context/ColetasContext'
import { WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { firstName, formatLitros, formatLongToday, formatRelative, isSameDay, litros, parseDate } from '../lib/format'
import { applyFilters, buckets, defaultFilters, ranking, summarize } from '../lib/report'

const GRAN = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { coletas, status, error, reload } = useColetas()
  const [gran, setGran] = useState('dia')
  const compact = useCompact()
  const filters = useMemo(() => defaultFilters(), [])

  const periodo = useMemo(() => applyFilters(coletas, filters), [coletas, filters])
  const sum = useMemo(() => summarize(periodo), [periodo])
  const bars = useMemo(() => buckets(periodo, filters, gran, compact ? 7 : 14), [periodo, filters, gran, compact])
  const hoje = useMemo(() => coletas.filter((c) => isSameDay(parseDate(c.DataRegistro), new Date())), [coletas])
  const top = useMemo(() => ranking(periodo).slice(0, 5), [periodo])
  const ativos = new Set(periodo.map((c) => c.Cadastrarid)).size

  return (
    <>
      <div className="page-head">
        <div>
          <p className="muted">{formatLongToday()}</p>
          <h1 className="h1">Olá, {firstName(user?.Nome)}</h1>
        </div>
        <p className="small">Últimos 30 dias</p>
      </div>

      {status === 'error' ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <>
          <div className="grid-kpi">
            <Kpi label="Volume total" loading={status === 'loading'} value={sum.totals.total} format={formatLitros} />
            <Kpi label="Reciclado" loading={status === 'loading'} value={sum.reciclado * 100} format={(n) => `${Math.round(n)}%`} color="var(--success)" />
            <Kpi label="Coletas hoje" loading={status === 'loading'} value={hoje.length} />
            <Kpi label="Colaboradores ativos" loading={status === 'loading'} value={ativos} />
          </div>

          <div className="grid-2">
            <section className="card" aria-labelledby="chart-title">
              <div className="card-head">
                <h2 className="h3" id="chart-title">
                  Volume por tipo
                </h2>
                <Segmented label="Agrupar por" options={GRAN} value={gran} onChange={setGran} />
              </div>
              {status === 'loading' ? (
                <Skeleton h={260} />
              ) : sum.count === 0 ? (
                <EmptyState title="Sem coletas nos últimos 30 dias" message="Quando os colaboradores registrarem coletas pelo app, elas aparecem aqui." />
              ) : (
                <>
                  <StackedBars data={bars} animKey={gran} />
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
              <section className="card" aria-labelledby="rank-title">
                <div className="card-head" style={{ marginBottom: 8 }}>
                  <h2 className="h3" id="rank-title">
                    Quem mais coletou
                  </h2>
                </div>
                {status === 'loading' ? (
                  <Skeleton h={120} />
                ) : top.length === 0 ? (
                  <p className="muted">Nenhuma coleta no período.</p>
                ) : (
                  top.map((r, i) => (
                    <div key={r.nome} className="list-row" style={{ display: 'block', animationDelay: `${i * 40}ms` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <b>{r.nome}</b>
                        <strong>{formatLitros(r.litros)}</strong>
                      </div>
                      <div className="rank-bar">
                        <span style={{ width: `${(r.litros / top[0].litros) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="card" aria-labelledby="recent-title">
                <div className="card-head" style={{ marginBottom: 4 }}>
                  <h2 className="h3" id="recent-title">
                    Últimas coletas
                  </h2>
                  <Link to="/painel/coletas" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                    Ver todas <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
                {status === 'loading' ? (
                  <Skeleton h={160} />
                ) : (
                  coletas.slice(0, 5).map((c, i) => {
                    const t = wasteFromValue(c.TipoResiduo)
                    return (
                      <div key={c.Id} className="list-row" style={{ animationDelay: `${i * 40}ms` }}>
                        <WasteIcon type={t} icon={WASTE_ICONS[t.key]} size={38} />
                        <div style={{ minWidth: 0 }}>
                          <b>{t.longLabel}</b>
                          <span className="muted" style={{ fontSize: 13 }}>
                            {formatRelative(c.DataRegistro)} · {c.NomeColaborador}
                          </span>
                        </div>
                        <strong>{formatLitros(litros(c))}</strong>
                      </div>
                    )
                  })
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Kpi({ label, value, format, color, loading }) {
  return (
    <div className="kpi card" style={{ border: 0 }}>
      <span className="muted">{label}</span>
      {loading ? <Skeleton h={32} w="60%" style={{ marginTop: 6 }} /> : <b style={{ color }}><AnimatedNumber value={value} format={format} /></b>}
    </div>
  )
}
