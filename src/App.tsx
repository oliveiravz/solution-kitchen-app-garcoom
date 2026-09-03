import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { BottomNav } from './components/common/BottomNav'
import { TablesPage } from './pages/tables/TablesPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { AccountPage } from './pages/account/AccountPage'
import { TableDetailPage } from './pages/tables/TableDetailPage'
import { NewOrderPage } from './pages/orders/NewOrderPage'
import { CloseAccountPage } from './pages/account/CloseAccountPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { setTenantId, setAuthTokenGetter } from './services/api'
import { signalRService } from './services/signalRService'
import { MenuManagementPage } from './pages/menu/MenuManagementPage'
import { TableManagementPage } from './pages/tables/TableManagementPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { useOrderNotifications } from './hooks/useOrderNotifications'
import { usePaymentRequestNotifications } from './hooks/usePaymentRequestNotifications'
import { WaitlistPage } from './pages/tables/WaitlistPage'
import { Toaster } from 'sonner'
import type { TenantBranding } from './services/brandingService'

const NAMESPACE = 'https://solution-kitchen.com'
const DEV_FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

function App({ branding }: { branding: TenantBranding }) {
  const { isLoading, isAuthenticated, loginWithRedirect, user, getAccessTokenSilently } = useAuth0()

  const roles: string[] = user?.[`${NAMESPACE}/roles`] ?? []
  const rawTenantId: string | undefined = user?.[`${NAMESPACE}/tenant_id`]
  const tenantId: string | undefined = rawTenantId ?? (import.meta.env.DEV ? DEV_FALLBACK_TENANT_ID : undefined)
  const isGerente = roles.includes('gerente')

  const podeAcessar = isAuthenticated && !!user && (roles.includes('garcom') || roles.includes('gerente')) && !!tenantId

  // Configura o tenant/token ANTES de qualquer página filha montar. Isso não
  // pode ficar num useEffect aqui: efeitos de componentes filhos (ex.: o
  // load() da MenuManagementPage) rodam ANTES do useEffect do pai no mesmo
  // commit, então a primeira requisição saía sem X-Tenant-Id (sem fallback
  // em build de produção) e o BFF respondia 400 antes mesmo de repassar pro
  // menu-service. Chamar direto no corpo do componente garante que os
  // defaults do axios já estão prontos no primeiro render das rotas.
  if (podeAcessar && tenantId) {
    setTenantId(tenantId)
    setAuthTokenGetter(() => getAccessTokenSilently())
    signalRService.setTenantId(tenantId)
    signalRService.setAuthTokenGetter(() => getAccessTokenSilently())
  }

  useEffect(() => {
    if (!podeAcessar) return
    signalRService.connect().catch(console.error)
  }, [podeAcessar])

  useOrderNotifications()
  usePaymentRequestNotifications()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-center flex flex-col items-center">
          <img src={branding.logoUrl} alt={branding.name} className="h-20 mb-4 max-w-[80vw] object-contain" />
          <p className="text-zinc-500 text-sm">Faça login para continuar</p>
        </div>
        <button
          onClick={() => loginWithRedirect()}
          className="w-full max-w-xs py-3.5 rounded-xl bg-accent-600 text-white font-medium text-sm cursor-pointer hover:bg-accent-500 transition-colors"
        >
          Entrar
        </button>
      </div>
    )
  }

  if (!roles.includes('garcom') && !roles.includes('gerente')) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-8">
        <div className="text-center">
          <p className="text-zinc-900 text-lg font-medium mb-2">Acesso negado</p>
          <p className="text-zinc-500 text-sm">Você não tem permissão para acessar este app.</p>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-8">
        <div className="text-center">
          <p className="text-zinc-900 text-lg font-medium mb-2">Conta sem restaurante vinculado</p>
          <p className="text-zinc-500 text-sm">Sua conta não está associada a nenhum restaurante. Entre em contato com o suporte.</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50">
        <Routes>
          <Route path="/" element={<TablesPage isGerente={isGerente} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route
            path="/tables/manage"
            element={isGerente ? <TableManagementPage /> : <Navigate to="/" replace />}
          />
          <Route path="/tables/:tableId" element={<TableDetailPage />} />
          <Route path="/tables/:tableId/new-order" element={<NewOrderPage />} />
          <Route path="/tables/:tableId/account" element={<CloseAccountPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/dashboard"
            element={isGerente ? <DashboardPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/menu"
            element={isGerente ? <MenuManagementPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/reports"
            element={isGerente ? <ReportsPage /> : <Navigate to="/" replace />}
          />
        </Routes>
        <BottomNav isGerente={isGerente} />
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          duration={6000}
        />
      </div>
    </BrowserRouter>
  )
}
export default App
