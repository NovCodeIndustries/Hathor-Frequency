import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { AdminApiError, adminApi, shortName, type AdminSummary, type AdminUser } from '../../lib/adminApi'
import type { AdminContext } from '../../lib/useAdmin'
import './AdminLayout.css'
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
  // Cerrar el menú móvil al cambiar de página
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setMenuOpen(false)
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
    adminApi.me().then(setAdmin).catch(toLogin)
  }, [toLogin])

  const refreshMe = useCallback(() => {
    adminApi.me().then(setAdmin).catch(() => {})
  }, [])

  const refreshSummary = useCallback(() => {
    adminApi.summary().then(setSummary).catch(() => {})
  }, [])

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

  const pendingTotal = (summary?.pendingBookings ?? 0) + (summary?.pendingReviews ?? 0) + (summary?.openContacts ?? 0)
  const tabs = [
    { to: '/admin', label: 'Inicio', end: true },
    { to: '/admin/reservas', label: 'Agenda', count: summary?.pendingBookings, kind: 'fill' },
    { to: '/admin/opiniones', label: 'Opiniones', count: summary?.pendingReviews, kind: 'gold' },
    { to: '/admin/contactos', label: 'Contactos', count: summary?.openContacts, kind: 'muted' },
    { to: '/admin/sitio', label: 'Sitio', count: summary?.siteChanges, kind: 'gold' },
    { to: '/admin/contenido', label: 'Contenido', count: summary?.contentChanges, kind: 'gold' },
    { to: '/admin/usuarios', label: admin.isRoot ? 'Usuarios' : 'Mi cuenta' },
  ]

  return (
    <div className="hf-admin">
      <meta name="robots" content="noindex" />
      <aside className={`hf-admin__side ${menuOpen ? 'is-open' : ''}`}>
        <div className="hf-admin__brand">
          <span className="hf-admin__logo">HATHOR</span>
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
          <span className="hf-admin__email">{admin.email}</span>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="hf-admin__main">
        <Outlet context={{ admin, summary, refreshSummary, refreshMe, onError } satisfies AdminContext} />
      </main>
    </div>
  )
}
