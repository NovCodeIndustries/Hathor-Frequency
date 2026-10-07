import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout/Layout'
import {
  ArtistsPage,
  BookingPage,
  ContactPage,
  HomePage,
  NotFoundPage,
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
      { path: 'reservar', element: <BookingPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'estudio', element: <StudioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
