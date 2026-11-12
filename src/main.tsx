import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/index.css'

async function startApplication(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    try {
      const { worker } = await import('@/mocks/browser')
      await worker.start({ onUnhandledRequest: 'bypass' })
    } catch (error) {
      // Sem o worker não há dados de demonstração, mas a UI precisa renderizar
      // e mostrar os próprios estados de erro em vez de uma tela em branco.
      console.error('[kurio] falha ao iniciar o MSW', error)
    }
  }

  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element is missing')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void startApplication()
