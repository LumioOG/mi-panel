import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FORM_SERVICIO_VACIO = {
  id: null,
  servicio_id: '',
  modelo_cobro: 'fijo_mensual',
  valor_fijo: '',
  valor_comision_lead: '',
  dia_cobro_fijo: '',
  servicios_incluidos: [],
}

const NOMBRES_MODELO = {
  fijo_mensual: 'Fijo mensual',
  comision_por_lead: 'Comisión por lead',
  mixto: 'Mixto (fijo + comisión)',
  proyecto_unico: 'Proyecto único',
}

export default function DetalleCliente() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [servicios, setServicios] = useState([])
  const [clienteServicios, setClienteServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_SERVICIO_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarTodo() {
    setCargando(true)
    setError('')

    const [clienteRes, serviciosRes, clienteServiciosRes] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('servicios').select('*').order('nombre'),
      supabase
        .from('cliente_servicios')
        .select('*, servicios(nombre)')
        .eq('cliente_id', id)
        .order('creado_en'),
    ])

    if (clienteRes.error) {
      setError('No se pudo cargar el cliente: ' + clienteRes.error.message)
    } else {
      setCliente(clienteRes.data)
    }
    if (serviciosRes.data) setServicios(serviciosRes.data)
    if (clienteServiciosRes.data) setClienteServicios(clienteServiciosRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarTodo()
  }, [id])

  function abrirNuevo() {
    setForm(FORM_SERVICIO_VACIO)
    setMostrarForm(true)
  }

  function abrirEditar(cs) {
    setForm({
      id: cs.id,
      servicio_id: cs.servicio_id,
      modelo_cobro: cs.modelo_cobro,
      valor_fijo: cs.valor_fijo || '',
      valor_comision_lead: cs.valor_comision_lead || '',
      dia_cobro_fijo: cs.dia_cobro_fijo || '',
      servicios_incluidos: cs.servicios_incluidos || [],
    })
    setMostrarForm(true)
  }

  const servicioSeleccionado = servicios.find((s) => s.id === form.servicio_id)
  const esMixto = servicioSeleccionado?.nombre?.includes('Mixto')
  const serviciosBase = servicios.filter((s) => !s.nombre.includes('Mixto'))

  function toggleServicioIncluido(nombre) {
    setForm((f) => ({
      ...f,
      servicios_incluidos: f.servicios_incluidos.includes(nombre)
        ? f.servicios_incluidos.filter((n) => n !== nombre)
        : [...f.servicios_incluidos, nombre],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      cliente_id: id,
      servicio_id: form.servicio_id,
      modelo_cobro: form.modelo_cobro,
      valor_fijo: Number(form.valor_fijo) || 0,
      valor_comision_lead: Number(form.valor_comision_lead) || 0,
      dia_cobro_fijo: form.dia_cobro_fijo ? Number(form.dia_cobro_fijo) : null,
      servicios_incluidos: esMixto ? form.servicios_incluidos : null,
    }

    let resultado
    if (form.id) {
      resultado = await supabase.from('cliente_servicios').update(payload).eq('id', form.id)
    } else {
      resultado = await supabase.from('cliente_servicios').insert(payload)
    }

    setGuardando(false)

    if (resultado.error) {
      setError('No se pudo guardar: ' + resultado.error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_SERVICIO_VACIO)
    cargarTodo()
  }

  async function handleEliminar(cs) {
    const confirmar = window.confirm(
      `¿Quitar el servicio "${cs.servicios?.nombre}" de este cliente? Esto también borrará los leads asociados a ese servicio.`
    )
    if (!confirmar) return

    const { error } = await supabase.from('cliente_servicios').delete().eq('id', cs.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarTodo()
  }

  if (cargando) return <div className="p-6 text-lumio-gray">Cargando...</div>
  if (!cliente) return <div className="p-6 text-lumio-gray">Cliente no encontrado.</div>

  return (
    <div className="p-6">
      <Link to="/clientes" className="text-sm text-lumio-blueberry hover:underline">
        ← Clientes
      </Link>

      <div className="flex items-start justify-between mt-1 mb-1 flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl text-lumio-charcoal">{cliente.nombre_empresa}</h1>
          <p className="text-lumio-gray text-sm">
            {cliente.nombre_contacto} {cliente.telefono && `· ${cliente.telefono}`}{' '}
            {cliente.email && `· ${cliente.email}`}
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            cliente.tipo_relacion === 'cliente_lumio'
              ? 'bg-lumio-blueberry/10 text-lumio-blueberry'
              : 'bg-lumio-gold/20 text-lumio-charcoal'
          }`}
        >
          {cliente.tipo_relacion === 'cliente_lumio' ? 'Cliente Lumio' : 'Emprendimiento propio'}
        </span>
      </div>

      {/* Navegación a los otros módulos de este cliente */}
      <div className="flex gap-2 mt-4 mb-6">
        <Link
          to={`/clientes/${id}/tareas-web`}
          className="text-sm bg-white border border-lumio-gray/20 hover:border-lumio-blueberry/40 px-3 py-1.5 rounded-full text-lumio-charcoal"
        >
          Tareas web
        </Link>
        <Link
          to={`/clientes/${id}/calendario`}
          className="text-sm bg-white border border-lumio-gray/20 hover:border-lumio-blueberry/40 px-3 py-1.5 rounded-full text-lumio-charcoal"
        >
          Calendario de redes
        </Link>
      </div>

      {error && (
        <div className="bg-lumio-burgundy-light border border-lumio-burgundy/20 text-lumio-burgundy text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-lumio-charcoal">Servicios y modelo de cobro</h2>
        <button
          onClick={abrirNuevo}
          className="text-sm bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-3 py-1.5 rounded-lg"
        >
          + Asignar servicio
        </button>
      </div>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Servicio</label>
              <select
                required
                value={form.servicio_id}
                onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Modelo de cobro</label>
              <select
                value={form.modelo_cobro}
                onChange={(e) => setForm({ ...form, modelo_cobro: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                {Object.entries(NOMBRES_MODELO).map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            {esMixto && (
              <div className="sm:col-span-2 bg-lumio-bg rounded-lg p-4">
                <p className="text-sm text-lumio-charcoal font-medium mb-2">
                  ¿Cuáles servicios incluye este "Mixto"?
                </p>
                <div className="space-y-1.5">
                  {serviciosBase.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-lumio-charcoal">
                      <input
                        type="checkbox"
                        checked={form.servicios_incluidos.includes(s.nombre)}
                        onChange={() => toggleServicioIncluido(s.nombre)}
                        className="rounded border-lumio-gray/30 text-lumio-blueberry focus:ring-lumio-blueberry"
                      />
                      {s.nombre}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(form.modelo_cobro === 'fijo_mensual' || form.modelo_cobro === 'mixto') && (
              <>
                <div>
                  <label className="block text-sm text-lumio-charcoal mb-1">
                    Valor fijo mensual (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.valor_fijo}
                    onChange={(e) => setForm({ ...form, valor_fijo: e.target.value })}
                    className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lumio-charcoal mb-1">
                    Día del mes para cobrar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dia_cobro_fijo}
                    onChange={(e) => setForm({ ...form, dia_cobro_fijo: e.target.value })}
                    placeholder="Ej. 5"
                    className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                  />
                </div>
              </>
            )}

            {(form.modelo_cobro === 'comision_por_lead' || form.modelo_cobro === 'mixto') && (
              <div>
                <label className="block text-sm text-lumio-charcoal mb-1">
                  Comisión por lead (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.valor_comision_lead}
                  onChange={(e) => setForm({ ...form, valor_comision_lead: e.target.value })}
                  className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                />
              </div>
            )}
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
                setForm(FORM_SERVICIO_VACIO)
              }}
              className="px-4 py-2 rounded-lg text-lumio-charcoal hover:bg-lumio-bg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {clienteServicios.length === 0 ? (
        <p className="text-lumio-gray bg-white rounded-2xl border border-lumio-gray/10 p-5">
          Este cliente aún no tiene servicios asignados.
        </p>
      ) : (
        <div className="space-y-3">
          {clienteServicios.map((cs) => (
            <div
              key={cs.id}
              className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 flex items-start justify-between flex-wrap gap-2"
            >
              <div>
                <p className="font-medium text-lumio-charcoal">{cs.servicios?.nombre}</p>
                <p className="text-sm text-lumio-gray">
                  {NOMBRES_MODELO[cs.modelo_cobro]}
                  {cs.valor_fijo > 0 && ` · $${Number(cs.valor_fijo).toLocaleString('es-CO')}/mes`}
                  {cs.dia_cobro_fijo && ` (día ${cs.dia_cobro_fijo})`}
                  {cs.valor_comision_lead > 0 &&
                    ` · $${Number(cs.valor_comision_lead).toLocaleString('es-CO')} por lead`}
                </p>
                {cs.servicios_incluidos?.length > 0 && (
                  <p className="text-xs text-lumio-blueberry mt-1">
                    Incluye: {cs.servicios_incluidos.join(' + ')}
                  </p>
                )}
              </div>
              <div className="space-x-3 whitespace-nowrap">
                <button
                  onClick={() => abrirEditar(cs)}
                  className="text-lumio-blueberry hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(cs)}
                  className="text-lumio-burgundy hover:underline text-sm"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
