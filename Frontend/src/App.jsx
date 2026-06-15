import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './auth/AuthProvider'
import './styles/public.css'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
