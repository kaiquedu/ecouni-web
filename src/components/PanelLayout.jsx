import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, LayoutGrid, LogOut, Users } from 'lucide-react'
import { Avatar, IconButton, Logo } from './ui'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/UiContext'
import { ColetasProvider } from '../context/ColetasContext'
import './layout.css'

const NAV = [
  { to: '/', end: true, label: 'Visão geral', icon: LayoutGrid },
  { to: '/coletas', label: 'Coletas', icon: ClipboardList },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuários', icon: Users },
]

export default function PanelLayout() {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const sair = async () => {
    if (await confirm({ title: 'Sair do painel?', message: 'Você vai precisar entrar de novo com e-mail e senha.', confirmLabel: 'Sair' })) logout()
  }

  return (
    <ColetasProvider>
      <div className="shell">
        <aside className="side">
          <Logo />
          <nav className="nav" aria-label="Painel">
            {NAV.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)} aria-label={label}>
                <Icon size={18} aria-hidden />
                <span className="nl">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="me">
            <Avatar name={user?.Nome} dark />
            <div>
              <b>{user?.Nome}</b>
              <span>Administrador</span>
            </div>
            <IconButton icon={LogOut} label="Sair" onClick={sair} />
          </div>
        </aside>
        <main className="main" key={pathname}>
          <Outlet />
        </main>
      </div>
    </ColetasProvider>
  )
}
