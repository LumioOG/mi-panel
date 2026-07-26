import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  id: null,
  fecha_publicacion: new Date().toISOString().slice(0, 10),
  canal: 'Instagram',
  copy: '',
  estado: 'idea',
}

const CANALES = ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'WhatsApp Estados', 'Otro']

const ESTADOS = {
  idea: { nombre: 'Idea', clase: 'bg-lumio-gray/15 text-lumio-charcoal' },
  programado: { nombre: 'Programado', clase: 'bg-lumio-gold/25 text-lumio-charcoal' },
  publicado: { nombre: 'Publicado', clase: 'bg-lumio-green/15 text-lumio-green' },
}

export default function CalendarioCliente() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [clienteRes, postsRes] = await Promise.all([
      supabase.from('clientes').select('nombre_empresa').eq('id', id).single(),
      supabase
        .from('calendario_redes')
        .select('*')
        .eq('cliente_id', id)
        .order('fecha_publicacion', { ascending: true }),
    ])

    if (clienteRes.data) setCliente(clienteRes.data)
    if (postsRes.error) {
      setError('No se pudo cargar el calendario: ' + postsRes.error.message)
    } else {
      setPosts(postsRes.data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [id])

  function abrirNuevo() {
    setForm({ ...FORM_VACIO })
    setMostrarForm(true)
  }

  function abrirEditar(post) {
    setForm({
      id: post.id,
      fecha_publicacion: post.fecha_publicacion,
      canal: post.canal,
      copy: post.copy || '',
      estado: post.estado,
    })
    setMostrarForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      cliente_id: id,
      fecha_publicacion: form.fecha_publicacion,
      canal: form.canal,
      copy: form.copy.trim() || null,
      estado: form.estado,
    }

    let resultado
    if (form.id) {
      resultado = await supabase.from('calendario_redes').update(payload).eq('id', form.id)
    } else {
      resultado = await supabase.from('calendario_redes').insert(payload)
    }

    setGuardando(false)

    if (resultado.error) {
      setError('No se pudo guardar: ' + resultado.error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_VACIO)
    cargarDatos()
  }

  async function cambiarEstadoRapido(post, nuevoEstado) {
    const { error } = await supabase
      .from('calendario_redes')
      .update({ estado: nuevoEstado })
      .eq('id', post.id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarDatos()
  }

  async function handleEliminar(post) {
    const confirmar = window.confirm('¿Eliminar esta publicación del calendario?')
    if (!confirmar) return
    const { error } = await supabase.from('calendario_redes').delete().eq('id', post.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarDatos()
  }

  const postsFiltrados = useMemo(
    () => (filtroEstado === 'todos' ? posts : posts.filter((p) => p.estado === filtroEstado)),
    [posts, filtroEstado]
  )

  return (
    <div className="p-6">
      <Link to={`/clientes/${id}`} className="text-sm text-lumio-blueberry hover:underline">
        ← {cliente?.nombre_empresa || 'Volver al cliente'}
      </Link>
      <div className="flex items-center justify-between mt-1 mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-lumio-charcoal">Calendario de redes</h1>
        <button
          onClick={abrirNuevo}
          className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nueva publicación
        </button>
      </div>
      <p className="text-lumio-gray mb-4">Planifica el contenido de este cliente.</p>

      <div className="flex gap-2 mb-6">
        {[{ id: 'todos', nombre: 'Todos' }, ...Object.entries(ESTADOS).map(([id, e]) => ({ id, nombre: e.nombre }))].map(
          (f) => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id)}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                filtroEstado === f.id
                  ? 'bg-lumio-burgundy text-white'
                  : 'bg-white text-lumio-charcoal border border-lumio-gray/20 hover:border-lumio-burgundy/40'
              }`}
            >
              {f.nombre}
            </button>
          )
        )}
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
          <h2 className="font-medium text-lumio-charcoal">
            {form.id ? 'Editar publicación' : 'Nueva publicación'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Fecha de publicación
              </label>
              <input
                type="date"
                required
                value={form.fecha_publicacion}
                onChange={(e) => setForm({ ...form, fecha_publicacion: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Canal</label>
              <select
                value={form.canal}
                onChange={(e) => setForm({ ...form, canal: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                {CANALES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-lumio-charcoal mb-1">
                Copy / descripción del post
              </label>
              <textarea
                rows={3}
                value={form.copy}
                onChange={(e) => setForm({ ...form, copy: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                {Object.entries(ESTADOS).map(([valor, e]) => (
                  <option key={valor} value={valor}>
                    {e.nombre}
                  </option>
                ))}
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
        <p className="text-lumio-gray">Cargando...</p>
      ) : postsFiltrados.length === 0 ? (
        <p className="text-lumio-gray bg-white rounded-2xl border border-lumio-gray/10 p-5">
          No hay publicaciones en esta vista.
        </p>
      ) : (
        <div className="space-y-3">
          {postsFiltrados.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-lumio-charcoal">
                    {new Date(post.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-sm text-lumio-gray">{post.canal}</p>
                </div>
                <select
                  value={post.estado}
                  onChange={(e) => cambiarEstadoRapido(post, e.target.value)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 ${ESTADOS[post.estado].clase}`}
                >
                  {Object.entries(ESTADOS).map(([valor, e]) => (
                    <option key={valor} value={valor}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {post.copy && (
                <p className="text-sm text-lumio-charcoal mt-3 whitespace-pre-wrap">{post.copy}</p>
              )}

              <div className="mt-3 space-x-3">
                <button
                  onClick={() => abrirEditar(post)}
                  className="text-lumio-blueberry hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(post)}
                  className="text-lumio-burgundy hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
