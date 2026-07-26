import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  categoria: '',
  fecha_limite: '',
}

const COLUMNAS = [
  { estado: 'pendiente', nombre: 'Pendiente' },
  { estado: 'en_progreso', nombre: 'En progreso' },
  { estado: 'hecho', nombre: 'Hecho' },
]

export default function Tareas() {
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarTareas() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('tareas_generales')
      .select('*')
      .order('creado_en', { ascending: true })

    if (error) {
      setError('No se pudieron cargar las tareas: ' + error.message)
    } else {
      setTareas(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarTareas()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { error } = await supabase.from('tareas_generales').insert({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria.trim() || null,
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
    cargarTareas()
  }

  async function cambiarEstado(tarea, nuevoEstado) {
    const { error } = await supabase
      .from('tareas_generales')
      .update({
        estado: nuevoEstado,
        completado_en: nuevoEstado === 'hecho' ? new Date().toISOString() : null,
      })
      .eq('id', tarea.id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarTareas()
  }

  async function handleEliminar(tarea) {
    const confirmar = window.confirm(`¿Eliminar "${tarea.titulo}"?`)
    if (!confirmar) return
    const { error } = await supabase.from('tareas_generales').delete().eq('id', tarea.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarTareas()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-lumio-charcoal">Tareas generales</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nueva tarea
        </button>
      </div>
      <p className="text-lumio-gray mb-6">
        Pendientes tuyos que no están ligados a ningún cliente: académico, certificaciones,
        proyectos personales.
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
              <label className="block text-sm text-lumio-charcoal mb-1">
                Categoría (libre)
              </label>
              <input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ej. Académico, Certificación, Personal"
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNAS.map((col) => (
            <div key={col.estado} className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-4">
              <p className="text-sm font-medium text-lumio-charcoal mb-3">
                {col.nombre}{' '}
                <span className="text-lumio-gray font-normal">
                  ({tareas.filter((t) => t.estado === col.estado).length})
                </span>
              </p>
              <div className="space-y-2">
                {tareas
                  .filter((t) => t.estado === col.estado)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="bg-lumio-bg rounded-xl p-3 text-sm border border-lumio-gray/10"
                    >
                      <p className="text-lumio-charcoal font-medium">{t.titulo}</p>
                      {t.categoria && (
                        <span className="inline-block text-xs bg-lumio-blueberry/10 text-lumio-blueberry px-2 py-0.5 rounded-full mt-1">
                          {t.categoria}
                        </span>
                      )}
                      {t.descripcion && (
                        <p className="text-xs text-lumio-gray mt-1">{t.descripcion}</p>
                      )}
                      {t.fecha_limite && (
                        <p className="text-xs text-lumio-gray mt-1">
                          Límite:{' '}
                          {new Date(t.fecha_limite + 'T00:00:00').toLocaleDateString('es-CO')}
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
                {tareas.filter((t) => t.estado === col.estado).length === 0 && (
                  <p className="text-xs text-lumio-gray">Nada aquí.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
