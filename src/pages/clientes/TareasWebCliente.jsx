import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  tipo: 'implementado_actual',
  fecha_limite: '',
}

const COLUMNAS = [
  { estado: 'pendiente', nombre: 'Pendiente' },
  { estado: 'en_progreso', nombre: 'En progreso' },
  { estado: 'hecho', nombre: 'Hecho' },
]

export default function TareasWebCliente() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [clienteRes, tareasRes] = await Promise.all([
      supabase.from('clientes').select('nombre_empresa').eq('id', id).single(),
      supabase
        .from('tareas_web')
        .select('*')
        .eq('cliente_id', id)
        .order('creado_en', { ascending: true }),
    ])

    if (clienteRes.data) setCliente(clienteRes.data)
    if (tareasRes.error) {
      setError('No se pudieron cargar las tareas: ' + tareasRes.error.message)
    } else {
      setTareas(tareasRes.data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { error } = await supabase.from('tareas_web').insert({
      cliente_id: id,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo: form.tipo,
      estado: 'pendiente',
      fecha_limite: form.fecha_limite || null,
    })

    setGuardando(false)

    if (error) {
      setError('No se pudo guardar: ' + error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_VACIO)
    cargarDatos()
  }

  async function cambiarEstado(tarea, nuevoEstado) {
    const { error } = await supabase
      .from('tareas_web')
      .update({
        estado: nuevoEstado,
        completado_en: nuevoEstado === 'hecho' ? new Date().toISOString() : null,
      })
      .eq('id', tarea.id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarDatos()
  }

  async function toggleImplementado(tarea) {
    const nuevoEstado = tarea.estado === 'hecho' ? 'pendiente' : 'hecho'
    await cambiarEstado(tarea, nuevoEstado)
  }

  async function handleEliminar(tarea) {
    const confirmar = window.confirm(`¿Eliminar "${tarea.titulo}"?`)
    if (!confirmar) return
    const { error } = await supabase.from('tareas_web').delete().eq('id', tarea.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarDatos()
  }

  const implementado = tareas.filter((t) => t.tipo === 'implementado_actual')
  const mejoras = tareas.filter((t) => t.tipo === 'mejora_futura')

  return (
    <div className="p-6">
      <Link to={`/clientes/${id}`} className="text-sm text-lumio-blueberry hover:underline">
        ← {cliente?.nombre_empresa || 'Volver al cliente'}
      </Link>
      <div className="flex items-center justify-between mt-1 mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-lumio-charcoal">Tareas web</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nueva tarea
        </button>
      </div>
      <p className="text-lumio-gray mb-6">
        Qué tiene la web ahora mismo, y qué falta por hacer.
      </p>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-lumio-charcoal mb-1">Título</label>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej. Sección de testimonios"
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-lumio-charcoal mb-1">
                Descripción (opcional)
              </label>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                <option value="implementado_actual">Ya implementado (estado actual)</option>
                <option value="mejora_futura">Mejora futura / pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Fecha límite (opcional)
              </label>
              <input
                type="date"
                value={form.fecha_limite}
                onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
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
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-lg text-lumio-charcoal hover:bg-lumio-bg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-lumio-gray">Cargando...</p>
      ) : (
        <>
          {/* Estado actual — checklist simple */}
          <h2 className="font-medium text-lumio-charcoal mb-3">Estado actual del sitio</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 mb-8">
            {implementado.length === 0 ? (
              <p className="text-sm text-lumio-gray">
                Nada registrado todavía. Agrega lo que la web ya tiene implementado.
              </p>
            ) : (
              <ul className="space-y-2">
                {implementado.map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.estado === 'hecho'}
                      onChange={() => toggleImplementado(t)}
                      className="mt-1 rounded border-lumio-gray/30 text-lumio-blueberry focus:ring-lumio-blueberry"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          t.estado === 'hecho'
                            ? 'text-lumio-gray line-through'
                            : 'text-lumio-charcoal'
                        }`}
                      >
                        {t.titulo}
                      </p>
                      {t.descripcion && (
                        <p className="text-xs text-lumio-gray">{t.descripcion}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEliminar(t)}
                      className="text-lumio-burgundy hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mejoras futuras — kanban */}
          <h2 className="font-medium text-lumio-charcoal mb-3">Mejoras y pendientes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNAS.map((col) => (
              <div key={col.estado} className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-4">
                <p className="text-sm font-medium text-lumio-charcoal mb-3">
                  {col.nombre}{' '}
                  <span className="text-lumio-gray font-normal">
                    ({mejoras.filter((t) => t.estado === col.estado).length})
                  </span>
                </p>
                <div className="space-y-2">
                  {mejoras
                    .filter((t) => t.estado === col.estado)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="bg-lumio-bg rounded-xl p-3 text-sm border border-lumio-gray/10"
                      >
                        <p className="text-lumio-charcoal font-medium">{t.titulo}</p>
                        {t.descripcion && (
                          <p className="text-xs text-lumio-gray mt-0.5">{t.descripcion}</p>
                        )}
                        {t.fecha_limite && (
                          <p className="text-xs text-lumio-gray mt-1">
                            Límite: {new Date(t.fecha_limite + 'T00:00:00').toLocaleDateString('es-CO')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <select
                            value={t.estado}
                            onChange={(e) => cambiarEstado(t, e.target.value)}
                            className="text-xs rounded-lg border border-lumio-gray/20 px-1.5 py-1"
                          >
                            {COLUMNAS.map((c) => (
                              <option key={c.estado} value={c.estado}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleEliminar(t)}
                            className="text-lumio-burgundy hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  {mejoras.filter((t) => t.estado === col.estado).length === 0 && (
                    <p className="text-xs text-lumio-gray">Nada aquí.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
