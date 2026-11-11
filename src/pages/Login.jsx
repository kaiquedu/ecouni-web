import { useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { Button, Field, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/format'
import { WASTE_ORDER, WASTE_TYPES } from '../lib/theme'
import './login.css'

const DEMO = { email: 'admin@ecouni.dev', senha: 'Demo@123' }
const PREVIEW = { reciclavel: 1359, papel: 536, naoReciclavel: 833 }
const ON_NAVY = { reciclavel: '#F2B130', papel: '#7FA2F0', naoReciclavel: '#9AA5B1' }

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const senhaRef = useRef(null)
  const total = useMemo(() => WASTE_ORDER.reduce((s, k) => s + PREVIEW[k], 0), [])

  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    const next = {}
    if (!isValidEmail(email)) next.email = 'Digite um e-mail válido, como nome@ecouni.dev.'
    if (!senha) next.senha = 'Digite sua senha.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await login(email, senha)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setFormError(err.status === 401 ? 'E-mail ou senha incorretos. Confira e tente de novo.' : err.message)
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <aside className="la" aria-hidden>
        <Logo />
        <div>
          <h1>Cada saco registrado vira dado para a gestão de resíduos do campus</h1>
          <p className="la-sub">Painel administrativo do EcoUni</p>
        </div>
        <div className="lstat">
          <span>Conta de demonstração, últimos 30 dias</span>
          <strong className="num">{total.toLocaleString('pt-BR')} L</strong>
          <div className="cb">
            {WASTE_ORDER.map((k) => (
              <i key={k} style={{ flexGrow: PREVIEW[k], background: ON_NAVY[k] }} />
            ))}
          </div>
          <ul>
            {WASTE_ORDER.map((k) => (
              <li key={k}>
                <i className="dot" style={{ background: ON_NAVY[k] }} />
                {WASTE_TYPES[k].label}
                <b className="num">{PREVIEW[k].toLocaleString('pt-BR')} L</b>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="lm">
        <span className="lm-logo">
          <Logo />
        </span>
        <form onSubmit={submit} noValidate>
          <h2>Entrar no painel</h2>
          <p className="lm-sub">Acesso exclusivo do administrador</p>
          <div className="stack" style={{ marginTop: 24 }}>
            <Field
              label="E-mail"
              icon={Mail}
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="nome@ecouni.dev"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
              }}
              onBlur={() => email && !isValidEmail(email) && setErrors((x) => ({ ...x, email: 'Digite um e-mail válido, como nome@ecouni.dev.' }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  senhaRef.current?.focus()
                }
              }}
              error={errors.email}
              enterKeyHint="next"
              autoFocus
            />
            <Field
              ref={senhaRef}
              label="Senha"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (errors.senha) setErrors((x) => ({ ...x, senha: undefined }))
              }}
              error={errors.senha}
              enterKeyHint="go"
            />
          </div>
          {formError ? (
            <p className="err" role="alert" style={{ marginTop: 16, fontSize: 13 }}>
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="btn-l btn-block" loading={loading} style={{ marginTop: 24 }}>
            Entrar
          </Button>
          <div className="demo">
            <div>
              <b>Conta de demonstração</b>
              <span>
                {DEMO.email}, senha {DEMO.senha}
              </span>
            </div>
            <Button
              variant="s"
              onClick={() => {
                setEmail(DEMO.email)
                setSenha(DEMO.senha)
                setErrors({})
                setFormError('')
              }}
            >
              Preencher
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
