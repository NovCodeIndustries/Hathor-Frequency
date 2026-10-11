import { Artists } from '../components/Artists/Artists'
import { Booking } from '../components/Booking/Booking'
import { Contact } from '../components/Contact/Contact'
import { Faq } from '../components/Faq/Faq'
import { Hero } from '../components/Hero/Hero'
import { Reviews } from '../components/Reviews/Reviews'
import { Services } from '../components/Services/Services'
import { Studio } from '../components/Studio/Studio'
import type { ReactNode } from 'react'
import { useEditState, useModule } from '../lib/siteModules'
import { ComingSoon } from './ComingSoon'

const SITE = 'Hathor Frequency'

// React 19 eleva <title> al <head> de forma automática

/** Página que se puede apagar en el panel · Sitio: apagada muestra "Próximamente" y no se indexa */
function PageGate({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const edit = useEditState(id)
  const show = useModule(id)
  // Modo edición: la página apagada muestra el aviso (se vuelve a encender desde la barra del panel)
  if (edit && !edit.on) {
    return (
      <div className="hf-edit-page">
        <span className="hf-edit-page__kick">Página oculta</span>
        <span className="hf-edit-page__title">Quien entre aquí verá “Próximamente”.</span>
        <span className="hf-edit-page__text">Sale del menú y se ocultan los botones que llevan a esta página.</span>
      </div>
    )
  }
  if (!show) {
    return (
      <>
        <title>{`${title} · ${SITE}`}</title>
        <meta name="robots" content="noindex" />
        <ComingSoon eyebrow={title} title="Próximamente" />
      </>
    )
  }
  return <>{children}</>
}

export function HomePage() {
  return (
    <>
      <title>{`${SITE} — Sello discográfico independiente en MX`}</title>
      <Hero />
    </>
  )
}

export function ServicesPage() {
  return (
    <PageGate id="page.servicios" title="Servicios">
      <title>{`Servicios · ${SITE}`}</title>
      <Services />
    </PageGate>
  )
}

export function ArtistsPage() {
  return (
    <PageGate id="page.artistas" title="Artistas">
      <title>{`Artistas · ${SITE}`}</title>
      <Artists />
    </PageGate>
  )
}

export function BookingPage() {
  return (
    <PageGate id="page.reservar" title="Reservar">
      <title>{`Reservar · ${SITE}`}</title>
      <Booking />
    </PageGate>
  )
}

export function ContactPage() {
  return (
    <PageGate id="page.contacto" title="Contacto">
      <title>{`Contacto · ${SITE}`}</title>
      <Contact />
    </PageGate>
  )
}

export function FaqPage() {
  return (
    <PageGate id="page.faq" title="Preguntas frecuentes">
      <title>{`Preguntas frecuentes · ${SITE}`}</title>
      <Faq />
    </PageGate>
  )
}

export function StudioPage() {
  return (
    <PageGate id="page.estudio" title="Estudio">
      <title>{`Estudio · ${SITE}`}</title>
      <Studio />
    </PageGate>
  )
}

export function NotFoundPage() {
  return (
    <>
      <title>{`Página no encontrada · ${SITE}`}</title>
      <ComingSoon eyebrow="404" title="Esta pista no existe" />
    </>
  )
}

export function ReviewsPage() {
  return (
    <PageGate id="page.opiniones" title="Opiniones">
      <title>{`Opiniones · ${SITE}`}</title>
      <Reviews />
    </PageGate>
  )
}
