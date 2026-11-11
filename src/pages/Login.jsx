import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Mail } from 'lucide-react'
import { Brand, Button, Field } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../lib/format'
import './login.css'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const senhaRef = useRef(null)

  if (user) return <Navigate to="/painel" replace />

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
      navigate('/painel', { replace: true })
    } catch (err) {
      setFormError(err.status === 401 ? 'E-mail ou senha incorretos. Confira e tente de novo.' : err.message)
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <aside className="login-side" aria-hidden>
        <Brand size={40} word={20} onDark />
        <div>
          <p className="login-quote">Cada saco registrado vira dado para a gestão de resíduos do campus.</p>
          <p className="login-sub">Painel administrativo do EcoUni</p>
        </div>
        <img src="/screens/relatorios.png" alt="" className="login-phone" />
      </aside>

      <main className="login-main">
        <Link to="/" className="login-back">
          <ArrowLeft size={18} aria-hidden /> Voltar ao site
        </Link>
        <form className="login-form rise" onSubmit={submit} noValidate>
          <div className="login-brand-mobile">
            <Brand size={36} word={18} />
          </div>
          <h1 className="h1" style={{ fontSize: 32 }}>
            Entrar no painel
          </h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 4 }}>
            Acesso exclusivo do administrador
          </p>
          <div className="form-stack" style={{ marginTop: 24 }}>
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
              error={errors.email}
              enterKeyHint="next"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), senhaRef.current?.focus())}
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
              enterKeyHint="done"
            />
          </div>
          {formError ? (
            <p className="field-error" role="alert" style={{ marginTop: 16, fontSize: 14 }}>
              {formError}
            </p>
          ) : null}
          <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 24 }}>
            Entrar
          </Button>
          <p className="muted" style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
            Ambiente de demonstração: <b>admin@ecouni.dev</b> / <b>Demo@123</b>
          </p>
        </form>
      </main>
    </div>
  )
}
