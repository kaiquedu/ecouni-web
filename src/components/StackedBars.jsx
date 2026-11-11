import { useEffect, useState } from 'react'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import { formatLitros } from '../lib/format'
import './StackedBars.css'

const niceMax = (v) => {
  if (v <= 0) return 4
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  const n = [1, 2, 2.5, 4, 5, 8, 10].find((m) => m * step >= v) * step
  return Math.ceil(n / 4) * 4
}

export default function StackedBars({ data, animKey }) {
  const [grown, setGrown] = useState(false)
  const [hover, setHover] = useState(null)
  const max = niceMax(Math.max(...data.map((d) => d.total), 0))

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      setGrown(false)
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    })
    return () => cancelAnimationFrame(raf)
  }, [animKey])

  return (
    <div className="chart">
      <div className="ch" key={animKey}>
        <div className="ch-y" aria-hidden>
          {[1, 0.75, 0.5, 0.25, 0].map((g) => (
            <span key={g}>{Math.round(max * g).toLocaleString('pt-BR')}</span>
          ))}
        </div>
        <div className="ch-p" role="img" aria-label={`Volume em litros: ${data.map((d) => `${d.label} ${formatLitros(d.total)}`).join(', ')}`}>
          {data.map((d, i) => (
            <div key={d.label} className="cc" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="st" style={{ height: grown ? `${(d.total / max) * 100}%` : 0, transitionDelay: `${i * 25}ms` }}>
                {WASTE_ORDER.slice()
                  .reverse()
                  .map((k) => (d[k] > 0 ? <i key={k} style={{ flex: d[k], background: WASTE_TYPES[k].color }} /> : null))}
              </div>
              {hover === i && d.total > 0 ? (
                <div className="tip" role="tooltip">
                  <b>{d.label}</b>
                  {WASTE_ORDER.map((k) => (
                    <span key={k}>
                      <i className="dot" style={{ background: WASTE_TYPES[k].color }} />
                      {WASTE_TYPES[k].label}
                      <strong className="num">{formatLitros(d[k])}</strong>
                    </span>
                  ))}
                  <span className="tt">
                    Total<strong className="num">{formatLitros(d.total)}</strong>
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="ch-x" aria-hidden>
          {data.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
