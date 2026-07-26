import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Pencil, EyeOff, Eye, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const FORM_SERVICIO_VACIO = {
  id: null,
  servicio_id: '',
  modelo_cobro: 'fijo_mensual',
  frecuencia_pago: 'mensual',
  valor_fijo: '',
  dia_cobro_fijo: '',
  valor_fijo_2: '',
  dia_cobro_fijo_2: '',
  valor_comision_lead: '',
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
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [servicios, setServicios] = useState([])
  const [clienteServicios, setClienteServicios] = useState([])
  const [trabajos, setTrabajos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_SERVICIO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [formCliente, setFormCliente] = useState(null)
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  async function cargarTodo() {
    setCargando(true)
    setError('')

    const [clienteRes, serviciosRes, clienteServiciosRes, trabajosRes] = await Promise.all([
      supabase.from('clientes').select('*, trabajos(nombre)').eq('id', id).single(),
      supabase.from('servicios').select('*').order('nombre'),
      supabase
        .from('cliente_servicios')
        .select('*, servicios(nombre)')
        .eq('cliente_id', id)
        .order('creado_en'),
      supabase.from('trabajos').select('*').order('nombre'),
    ])

    if (clienteRes.error) {
      setError('No se pudo cargar el cliente: ' + clienteRes.error.message)
    } else {
      setCliente(clienteRes.data)
      setFormCliente({
        nombre_empresa: clienteRes.data.nombre_empresa,
        nombre_contacto: clienteRes.data.nombre_contacto || '',
        telefono: clienteRes.data.telefono || '',
        email: clienteRes.data.email || '',
        tipo_relacion: clienteRes.data.tipo_relacion,
        trabajo_id: clienteRes.data.trabajo_id || '',
      })
    }
    if (serviciosRes.data) setServicios(serviciosRes.data)
    if (clienteServiciosRes.data) setClienteServicios(clienteServiciosRes.data)
    if (trabajosRes.data) setTrabajos(trabajosRes.data)

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
      frecuencia_pago: cs.frecuencia_pago || 'mensual',
      valor_fijo: cs.valor_fijo || '',
      dia_cobro_fijo: cs.dia_cobro_fijo || '',
      valor_fijo_2: cs.valor_fijo_2 || '',
      dia_cobro_fijo_2: cs.dia_cobro_fijo_2 || '',
      valor_comision_lead: cs.valor_comision_lead || '',
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

  async function guardarEdicionCliente(e) {
    e.preventDefault()
    setGuardandoCliente(true)
    setError('')

    const payload = {
      nombre_empresa: formCliente.nombre_empresa.trim(),
      nombre_contacto: formCliente.nombre_contacto.trim() || null,
      telefono: formCliente.telefono.trim() || null,
      email: formCliente.email.trim() || null,
      tipo_relacion: formCliente.tipo_relacion,
      trabajo_id: formCliente.tipo_relacion === 'emprendimiento_propio' ? formCliente.trabajo_id || null : null,
    }

    const { error } = await supabase.from('clientes').update(payload).eq('id', id)

    setGuardandoCliente(false)

    if (error) {
      setError('No se pudo guardar: ' + error.message)
      return
    }

    setEditandoCliente(false)
    cargarTodo()
  }

  async function toggleActivoCliente() {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: !cliente.activo })
      .eq('id', id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarTodo()
  }

  async function eliminarCliente() {
    const confirmar = window.confirm(
      `¿Eliminar por completo a "${cliente.nombre_empresa}"? Esto también borra sus servicios, leads, tareas web y calendario de redes. Esta acción no se puede deshacer.\n\nSi solo dejaste de trabajar con este cliente, es mejor usar "Desactivar" en vez de eliminar.`
    )
    if (!confirmar) return

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    navigate('/clientes')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      cliente_id: id,
      servicio_id: form.servicio_id,
      modelo_cobro: form.modelo_cobro,
      frecuencia_pago: form.frecuencia_pago,
      valor_fijo: Number(form.valor_fijo) || 0,
      dia_cobro_fijo: form.dia_cobro_fijo ? Number(form.dia_cobro_fijo) : null,
      valor_fijo_2: form.frecuencia_pago === 'quincenal' ? Number(form.valor_fijo_2) || 0 : 0,
      dia_cobro_fijo_2:
        form.frecuencia_pago === 'quincenal' && form.dia_cobro_fijo_2
          ? Number(form.dia_cobro_fijo_2)
          : null,
      valor_comision_lead: Number(form.valor_comision_lead) || 0,
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-lumio-charcoal">{cliente.nombre_empresa}</h1>
            {!cliente.activo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-lumio-gray/15 text-lumio-gray font-medium">
                Inactivo
              </span>
            )}
          </div>
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
          {cliente.tipo_relacion === 'cliente_lumio'
            ? 'Cliente Lumio'
            : cliente.trabajos?.nombre || 'Otro trabajo'}
        </span>
      </div>

      {/* Acciones sobre el cliente: editar, desactivar, eliminar — enlaces pequeños, no pills */}
      <div className="flex gap-4 mt-2 mb-1">
        <button
          onClick={() => setEditandoCliente(true)}
          className="flex items-center gap-1 text-xs text-lumio-gray hover:text-lumio-blueberry"
        >
          <Pencil size={13} /> Editar datos
        </button>
        <button
          onClick={toggleActivoCliente}
          className="flex items-center gap-1 text-xs text-lumio-gray hover:text-lumio-charcoal"
        >
          {cliente.activo ? <EyeOff size={13} /> : <Eye size={13} />}
          {cliente.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button
          onClick={eliminarCliente}
          className="flex items-center gap-1 text-xs text-lumio-gray hover:text-lumio-burgundy"
        >
          <Trash2 size={13} /> Eliminar
        </button>
      </div>

      {editandoCliente && (
        <form
          onSubmit={guardarEdicionCliente}
          className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 mt-4 space-y-4"
        >
          <h2 className="font-medium text-lumio-charcoal">Editar datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Nombre de empresa/emprendimiento
              </label>
              <input
                required
                value={formCliente.nombre_empresa}
                onChange={(e) => setFormCliente({ ...formCliente, nombre_empresa: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Nombre de contacto</label>
              <input
                value={formCliente.nombre_contacto}
                onChange={(e) => setFormCliente({ ...formCliente, nombre_contacto: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Teléfono</label>
              <input
                value={formCliente.telefono}
                onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Correo</label>
              <input
                type="email"
                value={formCliente.email}
                onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Tipo</label>
              <select
                value={formCliente.tipo_relacion}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, tipo_relacion: e.target.value, trabajo_id: '' })
                }
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                <option value="cliente_lumio">Cliente de Lumio</option>
                <option value="emprendimiento_propio">Otro trabajo</option>
              </select>
            </div>
            {formCliente.tipo_relacion === 'emprendimiento_propio' && (
              <div>
                <label className="block text-sm text-lumio-charcoal mb-1">¿Cuál trabajo?</label>
                <select
                  required
                  value={formCliente.trabajo_id}
                  onChange={(e) => setFormCliente({ ...formCliente, trabajo_id: e.target.value })}
                  className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                >
                  <option value="">Selecciona</option>
                  {trabajos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardandoCliente}
              className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {guardandoCliente ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => setEditandoCliente(false)}
              className="px-4 py-2 rounded-lg text-lumio-charcoal hover:bg-lumio-bg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

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
                <div className="sm:col-span-2">
                  <label className="block text-sm text-lumio-charcoal mb-1">
                    Frecuencia de pago
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, frecuencia_pago: 'mensual' })}
                      className={`text-sm px-3 py-1.5 rounded-full border ${
                        form.frecuencia_pago === 'mensual'
                          ? 'bg-lumio-blueberry text-white border-lumio-blueberry'
                          : 'bg-white text-lumio-charcoal border-lumio-gray/30'
                      }`}
                    >
                      Un solo pago mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, frecuencia_pago: 'quincenal' })}
                      className={`text-sm px-3 py-1.5 rounded-full border ${
                        form.frecuencia_pago === 'quincenal'
                          ? 'bg-lumio-blueberry text-white border-lumio-blueberry'
                          : 'bg-white text-lumio-charcoal border-lumio-gray/30'
                      }`}
                    >
                      Quincenal (por partes)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-lumio-charcoal mb-1">
                    {form.frecuencia_pago === 'quincenal' ? 'Primer pago (COP)' : 'Valor fijo mensual (COP)'}
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
                    Día {form.frecuencia_pago === 'quincenal' ? 'del primer pago' : 'del mes para cobrar'}
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

                {form.frecuencia_pago === 'quincenal' && (
                  <>
                    <div>
                      <label className="block text-sm text-lumio-charcoal mb-1">
                        Segundo pago (COP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.valor_fijo_2}
                        onChange={(e) => setForm({ ...form, valor_fijo_2: e.target.value })}
                        className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                      />
                      <p className="text-xs text-lumio-gray mt-1">
                        No tiene que ser igual al primero — pon el monto real.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-lumio-charcoal mb-1">
                        Día del segundo pago
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.dia_cobro_fijo_2}
                        onChange={(e) => setForm({ ...form, dia_cobro_fijo_2: e.target.value })}
                        placeholder="Ej. 20"
                        className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
                      />
                    </div>
                  </>
                )}
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
                  {cs.valor_fijo > 0 && cs.frecuencia_pago === 'quincenal' && (
                    <>
                      {' '}
                      · ${Number(cs.valor_fijo).toLocaleString('es-CO')} (día {cs.dia_cobro_fijo})
                      {' + '}${Number(cs.valor_fijo_2).toLocaleString('es-CO')} (día {cs.dia_cobro_fijo_2})
                    </>
                  )}
                  {cs.valor_fijo > 0 && cs.frecuencia_pago !== 'quincenal' && (
                    <>
                      {' '}
                      · ${Number(cs.valor_fijo).toLocaleString('es-CO')}/mes
                      {cs.dia_cobro_fijo && ` (día ${cs.dia_cobro_fijo})`}
                    </>
                  )}
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
