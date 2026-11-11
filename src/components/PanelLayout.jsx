import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import { Avatar, Brand } from './ui'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/UiContext'
import { ColetasProvider } from '../context/ColetasContext'
import './panel.css'

const NAV = [
  { to: '/painel', end: true, label: 'Visão geral', icon: LayoutDashboard },
  { to: '/painel/coletas', label: 'Coletas', icon: ClipboardList },
  { to: '/painel/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/painel/usuarios', label: 'Usuários', icon: Users },
]

export default function PanelLayout() {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const sair = async () => {
    if (await confirm({ title: 'Sair do painel?', message: 'Você vai precisar entrar de novo com e-mail e senha.', confirmLabel: 'Sair', destructive: true })) logout()
  }

  return (
    <ColetasProvider>
      <div className="panel">
        <header className="panel-top">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <Brand size={30} word={16} />
        </header>

        <aside className={`side${open ? ' open' : ''}`} aria-label="Menu do painel">
          <div className="side-head">
            <Brand size={34} word={17} />
            <button type="button" className="btn btn-ghost btn-icon side-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X size={22} />
            </button>
          </div>
          <nav className="side-nav">
            {NAV.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
                <Icon size={20} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="side-user">
            <Avatar name={user?.Nome} size={40} dark />
            <div style={{ minWidth: 0, flex: 1 }}>
              <b className="side-name">{user?.Nome}</b>
              <span className="role">Administrador</span>
            </div>
            <button type="button" className="btn btn-ghost btn-icon" onClick={sair} aria-label="Sair do painel">
              <LogOut size={20} />
            </button>
          </div>
        </aside>
        {open ? <div className="side-scrim" onClick={() => setOpen(false)} aria-hidden /> : null}

        <main className="panel-main" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </ColetasProvider>
  )
}
