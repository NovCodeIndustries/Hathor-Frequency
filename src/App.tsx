import { createBrowserRouter, RouterProvider } from 'react-router'
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

// El panel del estudio es otra app (src/panel/, su propio subdominio): aquí no hay nada de /admin
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
])

export default function App() {
  return <RouterProvider router={router} />
}
