import { Artists } from '../components/Artists/Artists'
import { Booking } from '../components/Booking/Booking'
import { Contact } from '../components/Contact/Contact'
import { Faq } from '../components/Faq/Faq'
import { Hero } from '../components/Hero/Hero'
import { Services } from '../components/Services/Services'
import { Studio } from '../components/Studio/Studio'
import { ComingSoon } from './ComingSoon'

const SITE = 'Hathor Frequency'

// React 19 eleva <title> al <head> de forma automática

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
    <>
      <title>{`Servicios · ${SITE}`}</title>
      <Services />
    </>
  )
}

export function ArtistsPage() {
  return (
    <>
      <title>{`Artistas · ${SITE}`}</title>
      <Artists />
    </>
  )
}

export function BookingPage() {
  return (
    <>
      <title>{`Reservar · ${SITE}`}</title>
      <Booking />
    </>
  )
}

export function ContactPage() {
  return (
    <>
      <title>{`Contacto · ${SITE}`}</title>
      <Contact />
    </>
  )
}

export function FaqPage() {
  return (
    <>
      <title>{`Preguntas frecuentes · ${SITE}`}</title>
      <Faq />
    </>
  )
}

export function StudioPage() {
  return (
    <>
      <title>{`Estudio · ${SITE}`}</title>
      <Studio />
    </>
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
