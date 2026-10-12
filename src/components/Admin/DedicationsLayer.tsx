import { useCallback, useEffect, useState } from 'react'
import { adminApi, type AdminUser, type BirthdayPerson, type Dedication } from '../../lib/adminApi'
import { askedToday, markAsked, type PartyStage } from '../../lib/birthdayParty'
import { useAdminLive } from '../../lib/useAdminLive'
import { DedicationSleeve } from './DedicationSleeve'
import { DedicationsReader } from './DedicationsReader'
import './Dedications.css'

/** "Xavier R." para firmar la funda */
const signatureOf = (u: AdminUser) => (u.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName[0]}.` : ''}` : u.name)

/**
 * Dedicatorias de cumpleaños en el panel (canvas https://claude.ai/artifact/HstNRu5Z4tKDXUgXsHTr91, D2 + L1):
 * - el equipo: la ventana de la funda se abre sola una vez al día por cada quien cumpla; en la primera pantalla
 *   (`landing`) queda el aviso para firmar o cambiar lo escrito;
 * - quien cumple: en su recorrido (paso `letters`, entre el pastel y los globos) las lee una a una; si llegan
 *   más tarde, el aviso "Tienes N dedicatorias nuevas" las abre.
 */
export function DedicationsLayer({
  admin,
  party,
  setParty,
  landing,
  onError,
}: {
  admin: AdminUser
  party: PartyStage | null
  setParty: (s: PartyStage | null) => void
  landing: boolean
  onError: (err: unknown) => string
}) {
  // ── Equipo: firmar la funda de quien cumple ──
  const [people, setPeople] = useState<BirthdayPerson[]>([])
  const [signing, setSigning] = useState<string | null>(null)
  const loadPeople = useCallback(() => {
    adminApi
      .dedicationsToday()
      .then((list) => {
        setPeople(list)
        // La ventana se abre sola la primera vez del día, si aún no firmó (y no está en su propio festejo)
        setSigning((cur) => cur ?? list.find((p) => !p.mine && !askedToday(admin.id, p.id))?.id ?? null)
      })
      .catch(() => {})
  }, [admin.id])
  useEffect(loadPeople, [loadPeople])

  // ── Quien cumple: leer las dedicatorias ──
  const [mine, setMine] = useState<Dedication[]>([])
  const [reading, setReading] = useState<Dedication[] | null>(null)
  const loadMine = useCallback(() => {
    if (!admin.birthday) return
    adminApi.myDedications().then(setMine).catch(() => {})
  }, [admin.birthday])
  useEffect(loadMine, [loadMine])
  useAdminLive(['dedications', 'users'], () => {
    loadPeople()
    loadMine()
  })

  // Paso del recorrido: si no hay dedicatorias, pasa directo a los globos
  useEffect(() => {
    if (party !== 'letters') return
    let alive = true
    adminApi
      .myDedications()
      .then((list) => {
        if (!alive) return
        setMine(list)
        if (list.length) setReading(list)
        else setParty('balloons')
      })
      .catch(() => alive && setParty('balloons'))
    return () => {
      alive = false
    }
  }, [party, setParty])

  const finishReading = (seen: string[]) => {
    setReading(null)
    if (seen.length) adminApi.markDedicationsRead(seen).then(loadMine).catch(() => {})
    if (party === 'letters') setParty('balloons')
  }

  const unread = mine.filter((d) => !d.read)
  const target = people.find((p) => p.id === signing)
  const showSleeve = target && party === null && !reading

  return (
    <>
      {/* Avisos en la primera pantalla del panel */}
      {landing && party === null && !reading && unread.length > 0 && (
        <div className="hf-dnotice" role="status">
          <span className="hf-dnotice__msg">
            Tienes <span>{unread.length === 1 ? '1 dedicatoria nueva' : `${unread.length} dedicatorias nuevas`}</span> del equipo.
          </span>
          <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" onClick={() => setReading(unread)}>
            Leer
          </button>
        </div>
      )}
      {landing &&
        party === null &&
        people.map((p) => (
          <div key={p.id} className={`hf-dnotice ${p.mine ? 'is-done' : ''}`} role="status">
            <span className="hf-dnotice__msg">
              {p.mine ? (
                <>Firmaste la funda de {p.firstName}. Puedes cambiar tu dedicatoria hoy.</>
              ) : (
                <>
                  Hoy cumple <span>{p.name}</span>. ¡Firma su funda!
                </>
              )}
            </span>
            <button
              type="button"
              className={`hf-admin__btn hf-admin__btn--sm ${p.mine ? 'hf-admin__btn--ghost' : 'hf-admin__btn--primary'}`}
              onClick={() => setSigning(p.id)}
            >
              {p.mine ? 'Cambiar' : 'Firmar la funda'}
            </button>
          </div>
        ))}

      {showSleeve && (
        <DedicationSleeve
          person={target}
          me={signatureOf(admin)}
          onError={onError}
          onSaved={loadPeople}
          onClose={() => {
            markAsked(admin.id, target.id)
            setSigning(null)
            loadPeople()
          }}
        />
      )}
      {reading && <DedicationsReader name={admin.firstName || admin.name} items={reading} onDone={finishReading} />}
    </>
  )
}
