import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { AdminApiError, adminApi, type AdminSummary, type AdminUser } from '../../lib/adminApi'
import type { AdminContext } from '../../lib/useAdmin'
import './AdminLayout.css'

/**
 * Panel del estudio (canvas https://claude.ai/artifact/PQevfwPDA7oRfVuasV4cXF): barra lateral izquierda
 * (la de A1) con el logo, las secciones con contadores y la sesión. Sin Ufo, ticker ni temporadas.
 */
export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)

  const toLogin = useCallback(
    () => navigate(`/admin/login?next=${encodeURIComponent(location.pathname)}`, { replace: true }),
    [navigate, location.pathname],
  )

  // Se revisa la sesión al entrar y al cambiar de pestaña
  useEffect(() => {
    adminApi.me().then(setAdmin).catch(toLogin)
  }, [toLogin])

  const refreshSummary = useCallback(() => {
    adminApi.summary().then(setSummary).catch(() => {})
  }, [])

  useEffect(() => {
    if (admin) refreshSummary()
  }, [admin, refreshSummary])

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

  const tabs = [
    { to: '/admin', label: 'Inicio', end: true },
    { to: '/admin/reservas', label: 'Reservas', count: summary?.pendingBookings, kind: 'fill' },
    { to: '/admin/opiniones', label: 'Opiniones', count: summary?.pendingReviews, kind: 'gold' },
    { to: '/admin/contactos', label: 'Contactos', count: summary?.openContacts, kind: 'muted' },
    { to: '/admin/bloqueos', label: 'Bloqueos' },
    { to: '/admin/sitio', label: 'Sitio', count: summary?.siteChanges, kind: 'gold' },
    { to: '/admin/contenido', label: 'Contenido', count: summary?.contentChanges, kind: 'gold' },
  ]

  return (
    <div className="hf-admin">
      <meta name="robots" content="noindex" />
      <aside className="hf-admin__side">
        <div className="hf-admin__brand">
          <span className="hf-admin__logo">HATHOR</span>
          <span className="hf-admin__sub">FREQUENCY</span>
          <span className="hf-admin__tag">Panel del estudio</span>
        </div>
        <nav className="hf-admin__tabs" aria-label="Panel">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="hf-admin__tab">
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
          <span className="hf-admin__name">{admin.name}</span>
          <span className="hf-admin__email">{admin.email}</span>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="hf-admin__main">
        <Outlet context={{ admin, summary, refreshSummary, onError } satisfies AdminContext} />
      </main>
    </div>
  )
}
