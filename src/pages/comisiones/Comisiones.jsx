import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  cliente_servicio_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  canal: 'WhatsApp',
  comision_generada: '',
}

const CANALES = ['WhatsApp', 'Llamada', 'Instagram', 'Facebook', 'Web (formulario)', 'Otro']

export default function Comisiones() {
  const [leads, setLeads] = useState([])
  const [clienteServicios, setClienteServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [filtroCobrado, setFiltroCobrado] = useState('pendientes')

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [leadsRes, csRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*, cliente_servicios(id, servicio_id, servicios(nombre), clientes(nombre_empresa))')
        .order('fecha', { ascending: false }),
      supabase
        .from('cliente_servicios')
        .select('id, valor_comision_lead, modelo_cobro, servicios(nombre), clientes(nombre_empresa)')
        .in('modelo_cobro', ['comision_por_lead', 'mixto']),
    ])

    if (leadsRes.error) {
      setError('No se pudieron cargar las comisiones: ' + leadsRes.error.message)
    } else {
      setLeads(leadsRes.data)
    }
    if (csRes.data) setClienteServicios(csRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const csSeleccionado = useMemo(
    () => clienteServicios.find((cs) => cs.id === form.cliente_servicio_id),
    [clienteServicios, form.cliente_servicio_id]
  )

  function handleSeleccionCS(id) {
    const cs = clienteServicios.find((c) => c.id === id)
    setForm({
      ...form,
      cliente_servicio_id: id,
      comision_generada: cs ? cs.valor_comision_lead : '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { error } = await supabase.from('leads').insert({
      cliente_servicio_id: form.cliente_servicio_id,
      fecha: form.fecha,
      canal: form.canal,
      comision_generada: Number(form.comision_generada),
    })

    setGuardando(false)

    if (error) {
      setError('No se pudo registrar: ' + error.message)
      return
    }

    setMostrarForm(false)
    setForm({ ...FORM_VACIO, fecha: form.fecha })
    cargarDatos()
  }

  async function toggleCobrado(lead) {
    const { error } = await supabase
      .from('leads')
      .update({
        cobrado: !lead.cobrado,
        fecha_cobro: !lead.cobrado ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', lead.id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarDatos()
  }

  async function handleEliminar(lead) {
    const confirmar = window.confirm('¿Eliminar este lead/comisión?')
    if (!confirmar) return
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarDatos()
  }

  const leadsFiltrados = leads.filter((l) => {
    if (filtroCobrado === 'todos') return true
    if (filtroCobrado === 'pendientes') return !l.cobrado
    return l.cobrado
  })

  const totalPendiente = useMemo(
    () => leads.filter((l) => !l.cobrado).reduce((acc, l) => acc + Number(l.comision_generada), 0),
    [leads]
  )

  // Agrupa lo pendiente por cliente, para saber a quién facturarle
  const pendientePorCliente = useMemo(() => {
    const grupos = {}
    leads
      .filter((l) => !l.cobrado)
      .forEach((l) => {
        const nombre = l.cliente_servicios?.clientes?.nombre_empresa || 'Cliente eliminado'
        grupos[nombre] = (grupos[nombre] || 0) + Number(l.comision_generada)
      })
    return Object.entries(grupos).sort((a, b) => b[1] - a[1])
  }, [leads])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-lumio-charcoal">Comisiones</h1>
        <button
          onClick={() => setMostrarForm(true)}
          disabled={clienteServicios.length === 0}
          className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + Registrar lead
        </button>
      </div>
      <p className="text-lumio-gray mb-6">
        Cada contacto o llamada que llega por un cliente con modelo de comisión.
      </p>

      {clienteServicios.length === 0 && !cargando && (
        <div className="bg-lumio-gold/20 text-lumio-charcoal text-sm rounded-lg p-3 mb-6">
          Ningún cliente tiene un servicio con modelo "comisión por lead" o "mixto" todavía. Ve a
          Clientes → elige uno → asígnale un servicio con ese modelo de cobro.
        </div>
      )}

      {error && (
        <div className="bg-lumio-burgundy-light border border-lumio-burgundy/20 text-lumio-burgundy text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Resumen destacado */}
      <div className="bg-lumio-blueberry rounded-2xl shadow-sm p-5 text-white mb-6">
        <p className="text-white/70 text-sm mb-1">Total pendiente por cobrar</p>
        <p className="text-3xl font-display mb-3">
          ${totalPendiente.toLocaleString('es-CO')}
        </p>
        {pendientePorCliente.length > 0 && (
          <div className="text-sm space-y-1 border-t border-white/10 pt-3">
            {pendientePorCliente.map(([nombre, valor]) => (
              <div key={nombre} className="flex justify-between text-white/80">
                <span>{nombre}</span>
                <span>${valor.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">Fecha</label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
            </div>

            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Cliente / servicio
              </label>
              <select
                required
                value={form.cliente_servicio_id}
                onChange={(e) => handleSeleccionCS(e.target.value)}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              >
                <option value="">Selecciona</option>
                {clienteServicios.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.clientes?.nombre_empresa} — {cs.servicios?.nombre}
                  </option>
                ))}
              </select>
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

            <div>
              <label className="block text-sm text-lumio-charcoal mb-1">
                Comisión generada (COP)
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.comision_generada}
                onChange={(e) => setForm({ ...form, comision_generada: e.target.value })}
                className="w-full rounded-lg border border-lumio-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumio-blueberry/40"
              />
              <p className="text-xs text-lumio-gray mt-1">
                Se sugiere el valor configurado para este cliente, pero puedes ajustarlo.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-lumio-blueberry hover:bg-lumio-blueberry-dark text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Registrar'}
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

      <div className="flex gap-2 mb-4">
        {[
          { id: 'pendientes', nombre: 'Pendientes' },
          { id: 'cobrados', nombre: 'Cobrados' },
          { id: 'todos', nombre: 'Todos' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroCobrado(f.id)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
              filtroCobrado === f.id
                ? 'bg-lumio-burgundy text-white'
                : 'bg-white text-lumio-charcoal border border-lumio-gray/20 hover:border-lumio-burgundy/40'
            }`}
          >
            {f.nombre}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-lumio-gray">Cargando...</p>
        ) : leadsFiltrados.length === 0 ? (
          <p className="p-5 text-lumio-gray">No hay leads en esta vista.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-lumio-gray border-b border-lumio-gray/10">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Comisión</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leadsFiltrados.map((l) => (
                <tr key={l.id} className="border-b border-lumio-gray/5 last:border-0">
                  <td className="px-4 py-3 text-lumio-gray">
                    {new Date(l.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-lumio-charcoal font-medium">
                    {l.cliente_servicios?.clientes?.nombre_empresa}
                    <span className="block text-xs text-lumio-gray font-normal">
                      {l.cliente_servicios?.servicios?.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lumio-gray">{l.canal}</td>
                  <td className="px-4 py-3 text-lumio-charcoal font-medium">
                    ${Number(l.comision_generada).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleCobrado(l)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        l.cobrado
                          ? 'bg-lumio-green/15 text-lumio-green'
                          : 'bg-lumio-gold/25 text-lumio-charcoal'
                      }`}
                    >
                      {l.cobrado ? 'Cobrado' : 'Pendiente'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEliminar(l)}
                      className="text-lumio-burgundy hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
