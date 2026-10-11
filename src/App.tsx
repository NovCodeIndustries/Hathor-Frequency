import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { Layout } from './components/Layout/Layout'
import {
  ArtistsPage,
  BookingPage,
  ContactPage,
  FaqPage,
  HomePage,
  NotFoundPage,
  ReviewsPage,
  ServicesPage,
  StudioPage,
} from './pages/pages'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'servicios', element: <ServicesPage /> },
      { path: 'artistas', element: <ArtistsPage /> },
      { path: 'opiniones', element: <ReviewsPage /> },
      { path: 'reservar', element: <BookingPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'estudio', element: <StudioPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Panel del estudio: fuera del Layout público (sin Nav, Ufo ni ticker) y cargado solo al entrar
  {
    path: 'admin/login',
    lazy: async () => ({ Component: (await import('./components/Admin/AdminLogin')).AdminLogin }),
  },
  {
    path: 'admin',
    lazy: async () => ({ Component: (await import('./components/Admin/AdminLayout')).AdminLayout }),
    children: [
      { index: true, element: <Navigate to="reservas" replace /> },
      { path: 'reservas', lazy: async () => ({ Component: (await import('./components/Admin/AdminAgenda')).AdminAgenda }) },
      { path: 'opiniones', lazy: async () => ({ Component: (await import('./components/Admin/AdminReviews')).AdminReviews }) },
      { path: 'contactos', lazy: async () => ({ Component: (await import('./components/Admin/AdminContacts')).AdminContacts }) },
      { path: 'bloqueos', lazy: async () => ({ Component: (await import('./components/Admin/AdminBlocks')).AdminBlocks }) },
      { path: '*', element: <Navigate to="reservas" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
