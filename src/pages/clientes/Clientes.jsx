import { Routes, Route } from 'react-router-dom'
import ListaClientes from './ListaClientes'
import DetalleCliente from './DetalleCliente'
import TareasWebCliente from './TareasWebCliente'
import CalendarioCliente from './CalendarioCliente'

export default function Clientes() {
  return (
    <Routes>
      <Route path="/" element={<ListaClientes />} />
      <Route path=":id" element={<DetalleCliente />} />
      <Route path=":id/tareas-web" element={<TareasWebCliente />} />
      <Route path=":id/calendario" element={<CalendarioCliente />} />
    </Routes>
  )
}
