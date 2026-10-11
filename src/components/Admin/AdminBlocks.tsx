import { useCallback, useEffect, useId, useState } from 'react'
import { timeSlots } from '../../data/booking'
import { adminApi, dateFromISO, type AdminBlock } from '../../lib/adminApi'
import {
  MONTHS,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  addMonths,
  compareMonths,
  dayLabel,
  monthCells,
  monthTitle,
  startOfDay,
  toISODate,
  type YearMonth,
} from '../../lib/calendar'
import { useAdmin } from '../../lib/useAdmin'
import './AdminBlocks.css'

interface Draft {
  iso: string
  closed: boolean
  slots: string[]
  reason: string
}

const lastOfMonth = ({ year, month }: YearMonth) => new Date(year, month + 1, 0)

/**
 * Bloqueos (diseño B1): calendario del mes para elegir el día y un panel para cerrarlo completo
 * o solo algunos horarios. Lo bloqueado deja de aparecer libre en Reservar.
 */
export function AdminBlocks() {
  const id = useId()
  const { onError } = useAdmin()
  const [today] = useState(() => startOfDay(new Date()))
  const currentMonth: YearMonth = { year: today.getFullYear(), month: today.getMonth() }
  const [month, setMonth] = useState<YearMonth>(currentMonth)
  const [selected, setSelected] = useState<Date>(today)
  const [monthBlocks, setMonthBlocks] = useState<AdminBlock[]>([])
  const [upcoming, setUpcoming] = useState<AdminBlock[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [tick, setTick] = useState(0)

  const from = toISODate(new Date(month.year, month.month, 1))
  const to = toISODate(lastOfMonth(month))

  useEffect(() => {
    let alive = true
    Promise.all([adminApi.blocks({ from, to }), adminApi.blocks({ from: toISODate(today) })])
      .then(([m, u]) => {
        if (!alive) return
        setMonthBlocks(m)
        setUpcoming(u)
      })
      .catch((err) => alive && setMessage(onError(err)))
    return () => {
      alive = false
    }
  }, [from, to, today, tick, onError])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const iso = toISODate(selected)
  const dayBlocks = monthBlocks.filter((b) => b.date === iso)
  // Lo guardado del día; el borrador lo reemplaza mientras se edita ese mismo día
  const saved: Draft = {
    iso,
    closed: dayBlocks.some((b) => b.startTime === null),
    slots: dayBlocks.flatMap((b) => (b.startTime ? [b.startTime] : [])),
    reason: dayBlocks.find((b) => b.reason)?.reason ?? '',
  }
  const current = draft?.iso === iso ? draft : saved
  const edit = (patch: Partial<Draft>) => {
    setDraft({ ...current, ...patch })
    setMessage('')
  }
  const dirty =
    current.closed !== saved.closed ||
    current.slots.length !== saved.slots.length ||
    current.slots.some((s) => !saved.slots.includes(s))

  const save = async () => {
    setSaving(true)
    try {
      const reason = current.reason.trim()
      const remove = dayBlocks.filter((b) =>
        b.startTime === null ? !current.closed : current.closed || !current.slots.includes(b.startTime),
      )
      const add: (string | undefined)[] = current.closed
        ? saved.closed ? [] : [undefined]
        : current.slots.filter((s) => !saved.slots.includes(s))
      await Promise.all(remove.map((b) => adminApi.removeBlock(b.id)))
      await Promise.all(add.map((t) => adminApi.addBlock(iso, t, reason)))
      setDraft(null)
      setMessage('Bloqueo guardado.')
      reload()
    } catch (err) {
      setMessage(onError(err))
      reload()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (b: AdminBlock) => {
    try {
      await adminApi.removeBlock(b.id)
      reload()
    } catch (err) {
      setMessage(onError(err))
    }
  }

  // Bloqueos próximos agrupados por día: "26 oct · Día completo" / "15 oct · 17:00, 19:00"
  const upcomingDays = [...new Set(upcoming.map((b) => b.date))].map((date) => {
    const list = upcoming.filter((b) => b.date === date)
    const d = dateFromISO(date)
    const full = list.find((b) => b.startTime === null)
    return {
      date,
      when: `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`,
      what: full ? 'Día completo' : list.map((b) => b.startTime).join(', '),
      reason: (full ?? list[0]).reason,
      ids: list,
    }
  })

  return (
    <>
      <title>Bloqueos · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">Bloqueos</h1>
          <p className="hf-admin__lead">Lo que bloquees aquí deja de aparecer libre en Reservar. No cancela reservas ya hechas.</p>
        </div>
      </div>

      <div className="hf-blocks">
        <section className="hf-blocks__cal" aria-label={monthTitle(month)}>
          <div className="hf-blocks__nav">
            <button
              type="button"
              className="hf-admin__arrow"
              aria-label="Mes anterior"
              disabled={compareMonths(month, currentMonth) <= 0}
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <span className="hf-blocks__month" aria-live="polite">{monthTitle(month)}</span>
            <button type="button" className="hf-admin__arrow" aria-label="Mes siguiente" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
          <div className="hf-blocks__week" aria-hidden="true">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="hf-blocks__days">
            {monthCells(month).map((d, i) => {
              if (!d) return <span key={`blank-${i}`} />
              const dIso = toISODate(d)
              const list = monthBlocks.filter((b) => b.date === dIso)
              const closed = list.some((b) => b.startTime === null)
              const partial = !closed && list.length > 0
              return (
                <button
                  key={dIso}
                  type="button"
                  className={`hf-blocks__day ${closed ? 'is-closed' : ''}`}
                  aria-pressed={dIso === iso}
                  aria-label={`${dayLabel(d)}${closed ? ', cerrado' : partial ? ', horarios bloqueados' : ''}`}
                  disabled={d < today}
                  onClick={() => setSelected(d)}
                >
                  {d.getDate()}
                  {partial && <span className="hf-blocks__dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          <div className="hf-blocks__legend">
            <span><i className="hf-blocks__key" />Día cerrado</span>
            <span><i className="hf-blocks__dot hf-blocks__dot--key" />Horarios bloqueados</span>
          </div>
        </section>

        <section className="hf-blocks__editor" aria-label="Bloquear">
          <span className="hf-blocks__kicker">Día elegido</span>
          <span className="hf-blocks__sel">
            {WEEKDAYS[(selected.getDay() + 6) % 7]} {selected.getDate()} de {MONTHS[selected.getMonth()]}
          </span>

          <label className="hf-blocks__toggle">
            <span>Cerrar el día completo</span>
            <input type="checkbox" checked={current.closed} onChange={(e) => edit({ closed: e.target.checked })} />
          </label>

          <fieldset className="hf-blocks__slots" disabled={current.closed}>
            <legend>O solo algunos horarios</legend>
            <div className="hf-blocks__grid">
              {timeSlots.map((t) => {
                const on = current.slots.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    className="hf-admin__filter hf-blocks__slot"
                    aria-pressed={on && !current.closed}
                    onClick={() => edit({ slots: on ? current.slots.filter((s) => s !== t) : [...current.slots, t] })}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="hf-admin__field" htmlFor={`${id}-reason`}>
            Motivo (solo lo ve el estudio)
            <input
              id={`${id}-reason`}
              className="hf-admin__input"
              type="text"
              maxLength={120}
              placeholder="Mantenimiento, día festivo…"
              value={current.reason}
              onChange={(e) => edit({ reason: e.target.value })}
            />
          </label>

          <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-blocks__save" disabled={!dirty || saving} onClick={save}>
            {saving ? 'Guardando…' : 'Guardar bloqueo'}
          </button>
          <p className="hf-blocks__msg" role="status">{message}</p>

          <div className="hf-blocks__upcoming">
            <span className="hf-blocks__kicker hf-blocks__kicker--muted">Próximos bloqueos</span>
            {upcomingDays.length === 0 && <span className="hf-blocks__muted">Ninguno.</span>}
            {upcomingDays.map((u) => (
              <div key={u.date} className="hf-blocks__item">
                <button type="button" className="hf-blocks__goto" onClick={() => {
                  const d = dateFromISO(u.date)
                  setSelected(d)
                  setMonth({ year: d.getFullYear(), month: d.getMonth() })
                }}>
                  <span>{u.when}</span> <span className="hf-blocks__muted">· {u.what}{u.reason ? ` · ${u.reason}` : ''}</span>
                </button>
                <button
                  type="button"
                  className="hf-blocks__remove"
                  aria-label={`Quitar bloqueo del ${u.when}`}
                  onClick={() => u.ids.forEach(remove)}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
