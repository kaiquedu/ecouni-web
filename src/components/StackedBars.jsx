import { useEffect, useState } from 'react'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import { formatLitros } from '../lib/format'
import './StackedBars.css'

export default function StackedBars({ data, height = 220, animKey }) {
  const [grown, setGrown] = useState(false)
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.total))

  useEffect(() => {
    setGrown(false)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    return () => cancelAnimationFrame(id)
  }, [animKey])

  return (
    <div className="bars" key={animKey}>
      <div className="bars-plot" style={{ height }} role="img" aria-label={`Gráfico de barras: ${data.map((d) => `${d.label} ${formatLitros(d.total)}`).join(', ')}`}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <span key={g} className="bars-grid" style={{ bottom: `${g * 100}%` }}>
            <em>{Math.round(max * g).toLocaleString('pt-BR')}</em>
          </span>
        ))}
        {data.map((d, i) => (
          <div key={d.label} className="bars-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div
              className="bars-bar"
              style={{
                height: grown ? `${Math.max(d.total ? 1.5 : 0, (d.total / max) * 100)}%` : 0,
                transitionDelay: `${i * 30}ms`,
              }}
            >
              {WASTE_ORDER.slice()
                .reverse()
                .map((k) => (d[k] > 0 ? <span key={k} style={{ flex: d[k], background: WASTE_TYPES[k].color }} /> : null))}
            </div>
            {hover === i ? (
              <div className="bars-tip" role="tooltip">
                <b>{d.label}</b>
                {WASTE_ORDER.map((k) => (
                  <span key={k}>
                    <i style={{ background: WASTE_TYPES[k].color }} />
                    {WASTE_TYPES[k].label}
                    <strong>{formatLitros(d[k])}</strong>
                  </span>
                ))}
                <span className="bars-tip-total">
                  Total<strong>{formatLitros(d.total)}</strong>
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="bars-labels" aria-hidden>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
