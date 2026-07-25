import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/layout/RutaProtegida'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Clientes from './pages/clientes/Clientes'
import Comisiones from './pages/comisiones/Comisiones'
import Tareas from './pages/tareas/Tareas'

export default function App() {
  return (
    <BrowserRouter basename="/mi-panel">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes/*" element={<Clientes />} />
            <Route path="/comisiones" element={<Comisiones />} />
            <Route path="/tareas" element={<Tareas />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
