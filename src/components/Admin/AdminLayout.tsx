import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { STAFF_ROUTES, AdminApiError, adminApi, formatStamp, shortName, type AdminSummary, type AdminUser } from '../../lib/adminApi'
import type { AdminContext } from '../../lib/useAdmin'
import './AdminLayout.css'
import './MaintenanceModal.css'
import { useSeason } from '../../lib/useSeason'
import { celebratedToday, partyStage, setPartyStage, startParty, type PartyStage } from '../../lib/birthdayParty'
import { BirthdayBalloons } from './BirthdayBalloons'
import { BirthdayCake } from './BirthdayCake'
import { DedicationsLayer } from './DedicationsLayer'
import { PanelWelcome } from './PanelWelcome'
import { GuideHelpButton, PanelGuide } from './PanelGuide'
import { guideFor, guideTargetVisible } from './guides'
import { SeasonGarland } from '../Season/SeasonGarland'
import { Glyph } from '../Ufo/seasonArt'
import { startAdminLive, stopAdminLive, useAdminLive } from '../../lib/useAdminLive'

/**
 * Panel del estudio (canvas https://claude.ai/artifact/PQevfwPDA7oRfVuasV4cXF): barra lateral izquierda
 * (la de A1) con el logo, las secciones con contadores y la sesión. Sin Ufo, ticker ni temporadas.
 */
export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Temporada del mes o cumpleaños del equipo: adorno arriba y glifo junto al logo (como en la web)
  const season = useSeason()
  const [welcome, setWelcome] = useState(false)
  // Guía del módulo (G5 · M2): sale sola la primera vez que se entra y el botón de ayuda la reabre
  const guide = guideFor(location.pathname)
  const [guideOpen, setGuideOpen] = useState(false)
  // Cumpleaños de quien entra (B3 en el login → B1 pastel → B4 globos), una vez al día; viene del login o empieza aquí
  const [party, setPartyState] = useState<PartyStage | null>(() => partyStage())
  const setParty = useCallback((stage: PartyStage | null) => {
    setPartyStage(stage)
    setPartyState(stage)
  }, [])
  const endParty = useCallback(() => setParty(null), [setParty])
  // Tras el pastel, las dedicatorias del equipo (si no hay, DedicationsLayer pasa a los globos)
  const toLetters = useCallback(() => setParty('letters'), [setParty])
  // Cerrar el menú móvil al cambiar de página
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setMenuOpen(false)
    setGuideOpen(false)
  }
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const toLogin = useCallback(
    () => navigate(`/admin/login?next=${encodeURIComponent(location.pathname)}`, { replace: true }),
    [navigate, location.pathname],
  )

  // Se revisa la sesión al entrar y al cambiar de pestaña
  useEffect(() => {
    adminApi
      .me()
      .then((u) => {
        // Con la sesión ya abierta (sin pasar por el login), el festejo empieza en el pastel
        // Usuario nuevo: la bienvenida queda abierta hasta que la termine (aunque la sesión se refresque al guardar)
        if (u.mustChangePassword) setWelcome(true)
        if (u.birthday && !celebratedToday(u.id)) {
          startParty(u.id)
          setPartyState('cake')
        }
        setAdmin(u)
      })
      .catch(toLogin)
  }, [toLogin])

  const refreshMe = useCallback(() => {
    adminApi.me().then(setAdmin).catch(() => {})
  }, [])

  const refreshSummary = useCallback(() => {
    adminApi.summary().then(setSummary).catch(() => {})
  }, [])

  const turnOn = async () => {
    try {
      await adminApi.setMaintenance({ enabled: false })
    } catch {
      // el aviso sigue; se reintenta desde el botón
    }
    refreshSummary()
  }

  useEffect(() => {
    if (admin) refreshSummary()
  }, [admin, refreshSummary])

  // Avisos en vivo: con sesión, la barra lateral se actualiza sola (reservas, opiniones, contactos…)
  useEffect(() => {
    if (!admin) return
    startAdminLive()
    return stopAdminLive
  }, [admin])
  useAdminLive('all', refreshSummary)
  // Si el principal te cambia el nombre o el rol, se nota sin recargar
  useAdminLive(['users'], refreshMe)

  // Arranque automático: cuando no haya otra ventana encima (bienvenida, festejo, dedicatorias…) y ya se vea lo que explica
  const guideKey = guide && admin && !admin.guidesSeen.includes(guide.key) ? guide.key : null
  const blocked = welcome || !!admin?.mustChangePassword || (party !== null && party !== 'balloons')
  useEffect(() => {
    if (!guideKey || guideOpen || blocked) return
    const g = guideFor(location.pathname)
    const t = window.setInterval(() => {
      if (document.querySelector('.hf-welcome, .hf-bcake, .hf-dreader, .hf-dsleeve, [aria-modal="true"]')) return
      if (!g?.steps.some((s) => s.target && !s.target.includes('"help"') && guideTargetVisible(s.target))) return
      window.clearInterval(t)
      setGuideOpen(true)
    }, 700)
    return () => window.clearInterval(t)
  }, [guideKey, guideOpen, blocked, location.pathname])

  const closeGuide = useCallback(() => {
    setGuideOpen(false)
    if (!guide) return
    const key = guide.key
    setAdmin((a) => (a && !a.guidesSeen.includes(key) ? { ...a, guidesSeen: [...a.guidesSeen, key] } : a))
    adminApi.markGuideSeen(key).then(refreshMe).catch(() => {})
  }, [guide, refreshMe, setGuideOpen])

  const onError = useCallback(
    (err: unknown) => {
      if (err instanceof AdminApiError && err.status === 401) toLogin()
      return err instanceof Error ? err.message : 'Algo salió mal'
    },
    [toLogin],
  )

  const logout = async () => {
    await adminApi.logout().catch(() => {})
    navigate('/admin/login', { replace: true })
  }

  if (!admin) {
    return (
      <div className="hf-admin hf-admin--loading" role="status">
        <meta name="robots" content="noindex" />
        Cargando panel…
      </div>
    )
  }

  // Rol STAFF: solo Agenda, Contactos y Mi cuenta; cualquier otra ruta lleva a la Agenda
  const staffOnly = admin.role === 'STAFF'
  if (staffOnly && !STAFF_ROUTES.some((r) => location.pathname === r || location.pathname.startsWith(`${r}/`))) {
    return <Navigate to="/admin/reservas" replace />
  }

  const pendingTotal = (summary?.pendingBookings ?? 0) + (summary?.pendingReviews ?? 0) + (summary?.openContacts ?? 0)
  const allTabs = [
    { to: '/admin', label: 'Inicio', end: true },
    { to: '/admin/reservas', label: 'Agenda', count: summary?.pendingBookings, kind: 'fill' },
    { to: '/admin/opiniones', label: 'Opiniones', count: summary?.pendingReviews, kind: 'gold' },
    { to: '/admin/contactos', label: 'Contactos', count: summary?.openContacts, kind: 'muted' },
    { to: '/admin/sitio', label: 'Sitio', count: summary?.siteChanges, kind: 'gold' },
    { to: '/admin/contenido', label: 'Contenido', count: summary?.contentChanges, kind: 'gold' },
    { to: '/admin/plugins', label: 'Plugins', count: summary?.pluginChanges, kind: 'gold' },
    { to: '/admin/usuarios', label: admin.isRoot ? 'Usuarios' : 'Mi cuenta' },
  ]
  const tabs = staffOnly ? allTabs.filter((t) => STAFF_ROUTES.includes(t.to)) : allTabs

  return (
    <div className="hf-admin">
      <meta name="robots" content="noindex" />
      <aside className={`hf-admin__side ${menuOpen ? 'is-open' : ''}`}>
        <div className="hf-admin__brand">
          <span className="hf-admin__logo">
            HATHOR
            {season && (
              <span className="hf-admin__logo-badge" aria-hidden="true">
                <Glyph name={season.page.logo} size={16} />
              </span>
            )}
          </span>
          <span className="hf-admin__sub">FREQUENCY</span>
          <span className="hf-admin__tag">Panel del estudio</span>
        </div>
        {/* Móvil y tablet: menú hamburguesa, como en la web */}
        <button
          type="button"
          className="hf-admin__burger"
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
          aria-label={menuOpen ? 'Cerrar menú' : `Abrir menú${pendingTotal ? `, ${pendingTotal} pendientes` : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 4l10 10M14 4 4 14" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14" /></svg>
          )}
          {!menuOpen && pendingTotal > 0 && <span className="hf-admin__burger-count" aria-hidden="true">{pendingTotal}</span>}
        </button>
        <nav id="admin-menu" className="hf-admin__tabs" aria-label="Panel">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="hf-admin__tab" onClick={() => setMenuOpen(false)}>
              <span>{t.label}</span>
              {!!t.count && (
                <span className={`hf-admin__count hf-admin__count--${t.kind}`} aria-label={`${t.count} pendientes`}>
                  {t.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hf-admin__user">
          <span className="hf-admin__name">{shortName(admin)}</span>
          <span className="hf-admin__email">{admin.username}</span>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className={`hf-admin__main ${season ? 'has-season' : ''}`}>
        {season && <SeasonGarland season={season} top />}
        {summary?.maintenance.enabled && (
          <div className="hf-admin__maint" role="status">
            <span>
              <strong>La web está en mantenimiento</strong>
              {summary.maintenance.startedAt && ` desde el ${formatStamp(summary.maintenance.startedAt)}`}
              {summary.maintenance.updatedByName && ` · la apagó ${summary.maintenance.updatedByName}`}. Los visitantes ven la pantalla de mantenimiento.
            </span>
            {!staffOnly && (
            <span className="hf-admin__maint-actions">
              {location.pathname !== '/admin/sitio' && (
                <Link to="/admin/sitio?mantenimiento=1" className="hf-admin__btn hf-admin__btn--sm">Ajustar</Link>
              )}
              <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" onClick={turnOn}>
                Encender la web
              </button>
            </span>
            )}
          </div>
        )}
        {/* Usuario nuevo (contraseña temporal): primero la bienvenida; la fiesta y las dedicatorias esperan */}
        {welcome && (
          <PanelWelcome
            admin={admin}
            onDone={() => {
              setWelcome(false)
              refreshMe()
            }}
            onLogout={logout}
            onError={onError}
          />
        )}
        {!welcome && !admin.mustChangePassword && (
        <DedicationsLayer
          admin={admin}
          party={party}
          setParty={setParty}
          landing={location.pathname === (staffOnly ? '/admin/reservas' : '/admin')}
          onError={onError}
        />
        )}
        {!welcome && !admin.mustChangePassword && party === 'balloons' && <BirthdayBalloons name={admin.firstName || shortName(admin)} onDone={endParty} />}
        {!welcome && !admin.mustChangePassword && party === 'cake' && <BirthdayCake name={admin.firstName || shortName(admin)} onDone={toLetters} onSkip={endParty} />}
        <Outlet context={{ admin, summary, refreshSummary, refreshMe, onError } satisfies AdminContext} />
        {guide && !welcome && <GuideHelpButton guide={guide} onOpen={() => setGuideOpen(true)} />}
        {guide && guideOpen && <PanelGuide key={guide.key} guide={guide} onClose={closeGuide} />}
      </main>
    </div>
  )
}
