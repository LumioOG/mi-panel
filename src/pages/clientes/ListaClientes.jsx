import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  id: null,
  nombre_empresa: '',
  nombre_contacto: '',
  telefono: '',
  email: '',
  tipo_relacion: 'cliente_lumio',
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  async function cargarClientes() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_empresa', { ascending: true })

    if (error) {
      setError('No se pudieron cargar los clientes: ' + error.message)
    } else {
      setClientes(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      nombre_empresa: form.nombre_empresa.trim(),
      nombre_contacto: form.nombre_contacto.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      tipo_relacion: form.tipo_relacion,
    }

    const { error } = await supabase.from('clientes').insert(payload)

    setGuardando(false)

    if (error) {
      setError('No se pudo guardar: ' + error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_VACIO)
    cargarClientes()
  }

  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === 'todos') return true
    return c.tipo_relacion === filtro
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-lumio-charcoal">Clientes</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nuevo cliente
        </button>
      </div>
      <p className="text-lumio-gray mb-4">
        Clientes de Lumio y tus propios emprendimientos, en un solo lugar.
      </p>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'todos', nombre: 'Todos' },
          { id: 'cliente_lumio', nombre: 'Clientes Lumio' },
          { id: 'emprendimiento_propio', nombre: 'Mis emprendimientos' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
              filtro === f.id
                ? 'bg-lumio-burgundy text-white'
                : 'bg-white text-lumio-charcoal border border-lumio-gray/20 hover:border-lumio-burgundy/40'
            }`}
          >
            {f.nombre}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-lumio-burgundy-light border border-lumio-burgundy/20 text-lumio-burgundy text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 mb-6 space-y-4"
        >
          <h2 className="font-medium text-lumio-charcoal">Nuevo cliente</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Nombre de empresa/emprendimiento
              </label>
              <input
                required
                value={form.nombre_empresa}
                onChange={(e) => setForm({ ...form, nombre_empresa: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Nombre de contacto
              </label>
              <input
                value={form.nombre_contacto}
                onChange={(e) => setForm({ ...form, nombre_contacto: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Correo</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-lumio-charcoal mb-1">Tipo</label>
              <select
                value={form.tipo_relacion}
                onChange={(e) => setForm({ ...form, tipo_relacion: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                <option value="cliente_lumio">Cliente de Lumio</option>
                <option value="emprendimiento_propio">Mi propio emprendimiento</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false)
                setForm(FORM_VACIO)
              }}
              className="px-4 py-2 rounded-lg text-lumio-charcoal hover:bg-lumio-bg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-lumio-gray">Cargando clientes...</p>
      ) : clientesFiltrados.length === 0 ? (
        <p className="text-lumio-gray bg-white rounded-2xl border border-lumio-gray/10 p-5">
          No hay clientes en esta categoría todavía.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((c) => (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 hover:shadow-md hover:border-lumio-blueberry/30 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-lumio-charcoal">{c.nombre_empresa}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.tipo_relacion === 'cliente_lumio'
                      ? 'bg-lumio-blueberry/10 text-lumio-blueberry'
                      : 'bg-lumio-gold/20 text-lumio-charcoal'
                  }`}
                >
                  {c.tipo_relacion === 'cliente_lumio' ? 'Lumio' : 'Propio'}
                </span>
              </div>
              {c.nombre_contacto && (
                <p className="text-sm text-lumio-gray">{c.nombre_contacto}</p>
              )}
              {c.telefono && <p className="text-sm text-lumio-gray">{c.telefono}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
