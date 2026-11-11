import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StackedBars from '../components/StackedBars'
import { AnimatedNumber, Dot, EmptyState, ErrorState, Seg, Skeleton, TypeBar, useCompact } from '../components/ui'
import { useColetas } from '../context/ColetasContext'
import { WASTE_ORDER, WASTE_TYPES, wasteFromValue } from '../lib/theme'
import { formatLitros, formatLongToday, formatRelative, isSameDay, litros, parseDate, totalsByType } from '../lib/format'
import { applyFilters, buckets, defaultFilters, ranking, summarize } from '../lib/report'

const PERIODS = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
]
const LABEL = { '7d': '7 dias', '30d': '30 dias', mes: 'Este mês' }

export default function Dashboard() {
  const { coletas, status, error, reload } = useColetas()
  const navigate = useNavigate()
  const compact = useCompact()
  const [period, setPeriod] = useState('30d')
  const [today] = useState(() => new Date())

  const filters = useMemo(() => ({ ...defaultFilters(), period }), [period])
  const list = useMemo(() => applyFilters(coletas, filters), [coletas, filters])
  const sum = useMemo(() => summarize(list), [list])
  const bars = useMemo(() => buckets(list, filters, 'dia', compact ? 7 : period === '7d' ? 7 : 14), [list, filters, compact, period])
  const hoje = useMemo(() => coletas.filter((c) => isSameDay(parseDate(c.DataRegistro), today)), [coletas, today])
  const hojeTot = useMemo(() => totalsByType(hoje), [hoje])
  const rank = useMemo(() => ranking(list).slice(0, 5), [list])
  const ativos = useMemo(() => new Set(list.map((c) => c.Cadastrarid)).size, [list])
  const loading = status === 'loading'

  const longDate = formatLongToday(today)

  return (
    <>
      <header className="ph">
        <div>
          <h1>Visão geral</h1>
          <p>{longDate.charAt(0).toUpperCase() + longDate.slice(1)} de {today.getFullYear()}</p>
        </div>
        <Seg label="Período" options={PERIODS} value={period} onChange={setPeriod} />
      </header>

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
              <small>Reciclável e papel sobre o total</small>
            </div>
            <div className="card stat">
              <span>Coletas hoje</span>
              {loading ? <Skeleton h={34} w="30%" style={{ marginTop: 4 }} /> : <strong><AnimatedNumber value={hoje.length} /></strong>}
              <small className="num">{formatLitros(hojeTot.total)} registrados</small>
            </div>
            <div className="card stat">
              <span>Colaboradores ativos</span>
              {loading ? <Skeleton h={34} w="30%" style={{ marginTop: 4 }} /> : <strong><AnimatedNumber value={ativos} /></strong>}
              <small>
                {sum.count} {sum.count === 1 ? 'coleta' : 'coletas'} em {LABEL[period].toLowerCase()}
              </small>
            </div>
          </div>

          <div className="grid">
            <section className="card flexcard" aria-labelledby="v-ch">
              <div className="card-h">
                <h2 id="v-ch">Volume por dia</h2>
                <div className="legend">
                  {WASTE_ORDER.map((k) => (
                    <span key={k}>
                      <Dot type={WASTE_TYPES[k]} />
                      {WASTE_TYPES[k].label}
                    </span>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="chart">
                  <Skeleton h="100%" style={{ minHeight: 260 }} />
                </div>
              ) : sum.count === 0 ? (
                <EmptyState title="Nenhuma coleta no período" message="Quando os colaboradores registrarem coletas pelo app, elas aparecem aqui." />
              ) : (
                <StackedBars data={bars} animKey={period + compact} />
              )}
            </section>

            <div className="col">
              <section className="card" aria-labelledby="v-rk">
                <div className="card-h">
                  <h2 id="v-rk">Quem mais coletou</h2>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {LABEL[period]}
                  </span>
                </div>
                {loading ? (
                  <div style={{ padding: 20 }}>
                    <Skeleton h={80} />
                  </div>
                ) : rank.length === 0 ? (
                  <p className="muted" style={{ padding: '12px 20px 20px' }}>
                    Ninguém coletou no período.
                  </p>
                ) : (
                  <ul className="rank">
                    {rank.map((r, i) => (
                      <li key={r.nome} style={{ animationDelay: `${i * 40}ms` }}>
                        <div className="r1">
                          <span>{r.nome}</span>
                          <span className="num">{formatLitros(r.litros)}</span>
                        </div>
                        <div className="r2">
                          <span>
                            {r.coletas} {r.coletas === 1 ? 'coleta' : 'coletas'}
                          </span>
                          <span className="num">{Math.round((r.litros / sum.totals.total) * 100)}% do volume</span>
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

              <section className="card grow" aria-labelledby="v-fd">
                <div className="card-h">
                  <h2 id="v-fd">Últimas coletas</h2>
                  <button className="linkbtn" type="button" onClick={() => navigate('/coletas')}>
                    Ver todas
                  </button>
                </div>
                {loading ? (
                  <div style={{ padding: 20 }}>
                    <Skeleton h={160} />
                  </div>
                ) : coletas.length === 0 ? (
                  <p className="muted" style={{ padding: '12px 20px 20px' }}>
                    Nenhuma coleta registrada ainda.
                  </p>
                ) : (
                  <ul className="feed">
                    {coletas.slice(0, 6).map((c, i) => {
                      const t = wasteFromValue(c.TipoResiduo)
                      return (
                        <li key={c.Id} style={{ animationDelay: `${i * 40}ms` }}>
                          <Dot type={t} />
                          <b>{t.longLabel}</b>
                          <span>
                            {c.NomeColaborador}, {formatRelative(c.DataRegistro).toLowerCase()}
                          </span>
                          <em className="num">{formatLitros(litros(c))}</em>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  )
}
