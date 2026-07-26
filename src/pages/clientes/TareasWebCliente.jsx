import { Link, useParams } from 'react-router-dom'

export default function TareasWebCliente() {
  const { id } = useParams()
  return (
    <div className="p-6">
      <Link to={`/clientes/${id}`} className="text-sm text-lumio-blueberry hover:underline">
        ← Volver al cliente
      </Link>
      <h1 className="font-display text-2xl text-lumio-charcoal mt-1 mb-1">Tareas web</h1>
      <p className="text-lumio-gray bg-white rounded-2xl border border-lumio-gray/10 p-5 mt-4">
        Módulo pendiente de construir.
      </p>
    </div>
  )
}
