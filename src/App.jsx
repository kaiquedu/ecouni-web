import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { Compass } from 'lucide-react'
import { EmptyState } from './components/ui'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'

const PanelLayout = lazy(() => import('./components/PanelLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Coletas = lazy(() => import('./pages/Coletas'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Usuarios = lazy(() => import('./pages/Usuarios'))

const Loading = () => <div style={{ minHeight: '100vh', background: 'var(--page)' }} aria-busy="true" />

const TITLES = {
  '/': 'EcoUni · Gestão de coleta de resíduos',
  '/login': 'Entrar · EcoUni',
  '/painel': 'Visão geral · EcoUni',
  '/painel/coletas': 'Coletas · EcoUni',
  '/painel/relatorios': 'Relatórios · EcoUni',
  '/painel/usuarios': 'Usuários · EcoUni',
}

function RequireAdmin({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <EmptyState icon={Compass} title="Página não encontrada" message="O endereço não existe ou foi alterado." action="Voltar ao início" onAction={() => (window.location.href = '/')} />
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] || 'EcoUni'
  }, [pathname])

  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/painel"
        element={
          <RequireAdmin>
            <PanelLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="coletas" element={<Coletas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}
