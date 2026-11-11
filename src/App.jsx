import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { Compass } from 'lucide-react'
import { EmptyState } from './components/ui'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'

const PanelLayout = lazy(() => import('./components/PanelLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Coletas = lazy(() => import('./pages/Coletas'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Usuarios = lazy(() => import('./pages/Usuarios'))

const TITLES = {
  '/': 'Visão geral',
  '/login': 'Entrar',
  '/coletas': 'Coletas',
  '/relatorios': 'Relatórios',
  '/usuarios': 'Usuários',
}

function RequireAdmin({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <EmptyState icon={Compass} title="Página não encontrada" message="O endereço não existe ou foi alterado." action="Ir para a visão geral" onAction={() => navigate('/')} />
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `${TITLES[pathname] || 'Página não encontrada'} · EcoUni`
  }, [pathname])

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} aria-busy="true" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
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
        <Route path="/painel/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
