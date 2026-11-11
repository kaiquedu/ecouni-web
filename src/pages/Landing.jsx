import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, ClipboardCheck, FileDown, History, Menu, ShieldCheck, Smartphone, Users, X } from 'lucide-react'
import { Brand, WasteIcon } from '../components/ui'
import { WASTE_ICONS } from '../components/waste'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import './landing.css'

const STEPS = [
  { icon: Smartphone, title: 'Registra no app', text: 'O colaborador escolhe o tipo de resíduo, o tamanho do saco e a quantidade. Leva poucos segundos.' },
  { icon: History, title: 'Acompanha o histórico', text: 'Cada coleta fica salva com data, hora e observações, agrupada por dia.' },
  { icon: BarChart3, title: 'Analisa no painel', text: 'O administrador vê volumes, percentual reciclado e quem mais coletou, e exporta em PDF ou CSV.' },
]

const FEATURES = [
  { icon: ClipboardCheck, title: 'Registro sem papel', text: 'Substitui a planilha preenchida à mão por um formulário com total em litros calculado na hora.' },
  { icon: BarChart3, title: 'Gráficos por período', text: 'Barras empilhadas por dia, semana ou mês, com filtros de tipo, período e colaborador.' },
  { icon: FileDown, title: 'Relatórios prontos', text: 'PDF com resumo, gráfico e lista de coletas, ou CSV para abrir em planilhas.' },
  { icon: Users, title: 'Gestão de acesso', text: 'O administrador cadastra colaboradores e remove contas que não são mais usadas.' },
  { icon: ShieldCheck, title: 'Dados protegidos', text: 'Login com token, senhas com hash e cada colaborador vê apenas as próprias coletas.' },
  { icon: History, title: 'Histórico completo', text: 'Busca, filtros e edição de qualquer coleta, no app ou no painel web.' },
]

const SHOTS = [
  ['inicio', 'Início com o total do dia'],
  ['registrar-coleta', 'Registro de coleta'],
  ['historico', 'Histórico agrupado por dia'],
  ['relatorios', 'Relatórios no app'],
]

function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown ? 'reveal in' : 'reveal']
}

function Section({ id, children, className = '' }) {
  const [ref, cls] = useReveal()
  return (
    <section id={id} ref={ref} className={`lp-section ${cls} ${className}`}>
      {children}
    </section>
  )
}

export default function Landing() {
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nav = (
    <>
      <a href="#como-funciona" onClick={() => setMenu(false)}>
        Como funciona
      </a>
      <a href="#recursos" onClick={() => setMenu(false)}>
        Recursos
      </a>
      <a href="#app" onClick={() => setMenu(false)}>
        O app
      </a>
    </>
  )

  return (
    <div className="lp">
      <header className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-wrap lp-nav-in">
          <Link to="/" aria-label="EcoUni, início" style={{ textDecoration: 'none' }}>
            <Brand size={34} word={17} />
          </Link>
          <nav className="lp-links" aria-label="Seções">
            {nav}
          </nav>
          <Link to="/login" className="btn lp-cta-nav">
            Acessar painel
          </Link>
          <button type="button" className="btn btn-ghost btn-icon lp-burger" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label={menu ? 'Fechar menu' : 'Abrir menu'}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menu ? (
          <nav className="lp-mobile-menu" aria-label="Seções">
            {nav}
            <Link to="/login" className="btn">
              Acessar painel
            </Link>
          </nav>
        ) : null}
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-hero-copy rise">
              <span className="lp-eyebrow">Gestão de resíduos para o campus</span>
              <h1 className="display">Coleta de resíduos registrada no celular e analisada no painel.</h1>
              <p className="lead" style={{ marginTop: 20 }}>
                O EcoUni troca a planilha de papel por um app para quem coleta e um painel para quem administra, com volumes por tipo de resíduo e relatórios prontos.
              </p>
              <div className="lp-hero-ctas">
                <Link to="/login" className="btn btn-lg">
                  Acessar painel <ArrowRight size={18} aria-hidden />
                </Link>
                <a href="#como-funciona" className="btn btn-lg btn-outline">
                  Como funciona
                </a>
              </div>
            </div>
            <div className="lp-hero-art" aria-hidden>
              <img src="/screens/inicio.png" alt="" className="lp-phone lp-phone-back" />
              <img src="/screens/relatorios.png" alt="" className="lp-phone lp-phone-front" />
              <div className="lp-float lp-float-a">
                <WasteIcon type={WASTE_TYPES.reciclavel} icon={WASTE_ICONS.reciclavel} size={36} />
                <div>
                  <b>120 L</b>
                  <span>Reciclável, agora</span>
                </div>
              </div>
              <div className="lp-float lp-float-b">
                <span className="lp-float-big">79%</span>
                <span>do volume reciclado</span>
              </div>
            </div>
          </div>
        </section>

        <Section id="como-funciona">
          <div className="lp-wrap">
            <span className="lp-eyebrow">Como funciona</span>
            <h2 className="lp-h2">Do saco coletado ao relatório, em três passos</h2>
            <div className="lp-steps">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <article key={title} className="lp-step" style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="lp-step-n">{i + 1}</span>
                  <span className="lp-step-icon">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="h3">{title}</h3>
                  <p className="muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </Section>

        <Section className="lp-types">
          <div className="lp-wrap lp-types-in">
            <div>
              <span className="lp-eyebrow">Três tipos de resíduo</span>
              <h2 className="lp-h2">Cada cor representa um destino diferente</h2>
              <p className="lead" style={{ marginTop: 12 }}>
                As mesmas cores aparecem no app, no painel e nos relatórios em PDF, então quem lê o gráfico identifica o tipo sem precisar da legenda.
              </p>
            </div>
            <div className="lp-type-list">
              {WASTE_ORDER.map((k, i) => (
                <div key={k} className="lp-type" style={{ transitionDelay: `${i * 80}ms` }}>
                  <WasteIcon type={WASTE_TYPES[k]} icon={WASTE_ICONS[k]} size={48} />
                  <div>
                    <b>{WASTE_TYPES[k].longLabel}</b>
                    <span className="muted">{WASTE_TYPES[k].hint}</span>
                  </div>
                  <i style={{ background: WASTE_TYPES[k].color }} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="recursos">
          <div className="lp-wrap">
            <span className="lp-eyebrow">Recursos</span>
            <h2 className="lp-h2">O que o EcoUni resolve</h2>
            <div className="lp-features">
              {FEATURES.map(({ icon: Icon, title, text }, i) => (
                <article key={title} className="lp-feature" style={{ transitionDelay: `${i * 60}ms` }}>
                  <span className="lp-step-icon">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="h3">{title}</h3>
                  <p className="muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </Section>

        <Section id="app" className="lp-app">
          <div className="lp-wrap">
            <span className="lp-eyebrow" style={{ color: 'var(--navy-text)' }}>
              O app
            </span>
            <h2 className="lp-h2" style={{ color: 'var(--white)' }}>
              Feito para usar com uma mão, no meio da coleta
            </h2>
            <div className="lp-shots">
              {SHOTS.map(([file, caption], i) => (
                <figure key={file} style={{ transitionDelay: `${i * 80}ms` }}>
                  <img src={`/screens/${file}.png`} alt={caption} loading="lazy" width="360" height="800" />
                  <figcaption>{caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Section>

        <Section className="lp-final">
          <div className="lp-wrap lp-final-in">
            <h2 className="lp-h2">Veja os dados da coleta do seu campus</h2>
            <p className="lead">Entre com a conta de demonstração para explorar o painel com 30 dias de coletas de exemplo.</p>
            <Link to="/login" className="btn btn-lg">
              Acessar painel <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </Section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <Brand size={30} word={15} />
          <p className="muted">Projeto de Conclusão de Curso, Centro Universitário UNIFAAT.</p>
          <nav className="lp-footer-links" aria-label="Repositórios">
            <a href="https://github.com/kaiquedu/ecouni-mobile" target="_blank" rel="noreferrer">
              App
            </a>
            <a href="https://github.com/kaiquedu/ecouni-backend" target="_blank" rel="noreferrer">
              API
            </a>
            <a href="https://github.com/kaiquedu/ecouni-web" target="_blank" rel="noreferrer">
              Web
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
