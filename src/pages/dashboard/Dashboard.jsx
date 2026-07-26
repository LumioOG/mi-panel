import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
function enDias(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Dashboard() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [tareasWeb, setTareasWeb] = useState([])
  const [posts, setPosts] = useState([])
  const [cobrosFijos, setCobrosFijos] = useState([])
  const [tareasGenerales, setTareasGenerales] = useState([])
  const [totalPendienteComisiones, setTotalPendienteComisiones] = useState(0)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')

      const [tareasWebRes, postsRes, csRes, tareasGenRes, leadsRes] = await Promise.all([
        supabase
          .from('tareas_web')
          .select('id, titulo, fecha_limite, estado, clientes(nombre_empresa)')
          .not('fecha_limite', 'is', null)
          .neq('estado', 'hecho')
          .gte('fecha_limite', hoyISO())
          .lte('fecha_limite', enDias(7)),
        supabase
          .from('calendario_redes')
          .select('id, fecha_publicacion, canal, estado, clientes(nombre_empresa)')
          .gte('fecha_publicacion', hoyISO())
          .lte('fecha_publicacion', enDias(7)),
        supabase
          .from('cliente_servicios')
          .select('id, valor_fijo, dia_cobro_fijo, clientes(nombre_empresa)')
          .not('dia_cobro_fijo', 'is', null)
          .in('modelo_cobro', ['fijo_mensual', 'mixto']),
        supabase
          .from('tareas_generales')
          .select('id, titulo, fecha_limite, estado, categoria')
          .not('fecha_limite', 'is', null)
          .neq('estado', 'hecho')
          .gte('fecha_limite', hoyISO())
          .lte('fecha_limite', enDias(7)),
        supabase.from('leads').select('comision_generada').eq('cobrado', false),
      ])

      if (tareasWebRes.error || postsRes.error || csRes.error || tareasGenRes.error) {
        setError('No se pudieron cargar algunos datos del panel.')
      }

      setTareasWeb(tareasWebRes.data || [])
      setPosts(postsRes.data || [])
      setTareasGenerales(tareasGenRes.data || [])

      if (leadsRes.data) {
        setTotalPendienteComisiones(
          leadsRes.data.reduce((acc, l) => acc + Number(l.comision_generada), 0)
        )
      }

      // Calcula qué cobros fijos caen en los próximos 7 días (comparando el día del mes)
      if (csRes.data) {
        const hoy = new Date()
        const proximos = []
        for (let i = 0; i <= 7; i++) {
          const fecha = new Date()
          fecha.setDate(hoy.getDate() + i)
          const diaDelMes = fecha.getDate()
          csRes.data.forEach((cs) => {
            if (cs.dia_cobro_fijo === diaDelMes) {
              proximos.push({ ...cs, fecha: fecha.toISOString().slice(0, 10) })
            }
          })
        }
        setCobrosFijos(proximos)
      }

      setCargando(false)
    }

    cargar()
  }, [])

  // Arma la línea de tiempo de los próximos 7 días, mezclando todo
  const timeline = useMemo(() => {
    const dias = []
    for (let i = 0; i < 7; i++) {
      const fecha = enDias(i)
      const fechaObj = new Date(fecha + 'T00:00:00')
      dias.push({
        fecha,
        nombre: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : NOMBRES_DIA[fechaObj.getDay()],
        fechaCorta: fechaObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        items: [],
      })
    }

    tareasWeb.forEach((t) => {
      const dia = dias.find((d) => d.fecha === t.fecha_limite)
      if (dia)
        dia.items.push({
          tipo: 'tarea_web',
          texto: `${t.titulo} — ${t.clientes?.nombre_empresa}`,
        })
    })
    posts.forEach((p) => {
      const dia = dias.find((d) => d.fecha === p.fecha_publicacion)
      if (dia)
        dia.items.push({
          tipo: 'post',
          texto: `Publicar en ${p.canal} — ${p.clientes?.nombre_empresa}`,
        })
    })
    cobrosFijos.forEach((c) => {
      const dia = dias.find((d) => d.fecha === c.fecha)
      if (dia)
        dia.items.push({
          tipo: 'cobro',
          texto: `Cobrar $${Number(c.valor_fijo).toLocaleString('es-CO')} a ${c.clientes?.nombre_empresa}`,
        })
    })
    tareasGenerales.forEach((t) => {
      const dia = dias.find((d) => d.fecha === t.fecha_limite)
      if (dia) dia.items.push({ tipo: 'tarea_general', texto: t.titulo })
    })

    return dias
  }, [tareasWeb, posts, cobrosFijos, tareasGenerales])

  const ETIQUETAS_TIPO = {
    tarea_web: { color: 'bg-lumio-blueberry/10 text-lumio-blueberry', nombre: 'Web' },
    post: { color: 'bg-lumio-gold/25 text-lumio-charcoal', nombre: 'Redes' },
    cobro: { color: 'bg-lumio-burgundy/10 text-lumio-burgundy', nombre: 'Cobro' },
    tarea_general: { color: 'bg-lumio-green/15 text-lumio-green', nombre: 'General' },
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-lumio-charcoal mb-1">Dashboard</h1>
      <p className="text-lumio-gray mb-6">Tu semana, todo en un solo lugar.</p>

      {error && (
        <div className="bg-lumio-burgundy-light border border-lumio-burgundy/20 text-lumio-burgundy text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Tarjeta destacada de comisiones pendientes */}
      <div className="bg-lumio-blueberry rounded-2xl shadow-sm p-5 text-white mb-6">
        <p className="text-white/70 text-sm mb-1">Comisiones pendientes por cobrar</p>
        <p className="text-3xl font-display">
          ${totalPendienteComisiones.toLocaleString('es-CO')}
        </p>
      </div>

      {cargando ? (
        <p className="text-lumio-gray">Cargando tu semana...</p>
      ) : (
        <div className="space-y-3">
          {timeline.map((dia) => (
            <div
              key={dia.fecha}
              className="bg-white rounded-2xl shadow-sm border border-lumio-gray/10 p-4 flex gap-4"
            >
              <div className="w-20 shrink-0">
                <p className="font-medium text-lumio-charcoal text-sm">{dia.nombre}</p>
                <p className="text-xs text-lumio-gray">{dia.fechaCorta}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {dia.items.length === 0 ? (
                  <p className="text-sm text-lumio-gray/60">Sin pendientes</p>
                ) : (
                  dia.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ETIQUETAS_TIPO[item.tipo].color}`}
                      >
                        {ETIQUETAS_TIPO[item.tipo].nombre}
                      </span>
                      <span className="text-sm text-lumio-charcoal">{item.texto}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
