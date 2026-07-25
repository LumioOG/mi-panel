import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RutaProtegida({ children }) {
  const { session, cargando } = useAuth()

  if (cargando) return <div className="p-6 text-lumio-charcoal">Cargando...</div>
  if (!session) return <Navigate to="/login" replace />

  return children
}
