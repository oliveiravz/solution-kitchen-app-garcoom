import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import { applyBranding, loadBranding, mockRestaurantBranding } from './services/brandingService'

async function bootstrap() {
  const useMockBranding = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_BRANDING !== 'false'
  const branding = useMockBranding
    ? mockRestaurantBranding
    : await loadBranding(window.location.host)
  applyBranding(branding)

  createRoot(document.getElementById('root')!).render(
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      <App branding={branding} />
    </Auth0Provider>
  )
}

void bootstrap()