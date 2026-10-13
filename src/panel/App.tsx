import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

/**
 * Panel del estudio: app aparte de la web (su propio build, servidor y subdominio).
 * Las rutas conservan el prefijo /admin, igual que la API (/api/admin/*).
 */
const router = createBrowserRouter([
  { index: true, element: <Navigate to="/admin" replace /> },
  {
    path: 'admin/login',
    lazy: async () => ({ Component: (await import('../components/Admin/AdminLogin')).AdminLogin }),
  },
  {
    path: 'admin',
    lazy: async () => ({ Component: (await import('../components/Admin/AdminLayout')).AdminLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('../components/Admin/AdminDashboard')).AdminDashboard }) },
      { path: 'reservas', lazy: async () => ({ Component: (await import('../components/Admin/AdminAgenda')).AdminAgenda }) },
      { path: 'opiniones', lazy: async () => ({ Component: (await import('../components/Admin/AdminReviews')).AdminReviews }) },
      { path: 'contactos', lazy: async () => ({ Component: (await import('../components/Admin/AdminContacts')).AdminContacts }) },
      // Bloqueos vive dentro de la Agenda (reservas + bloqueos)
      { path: 'bloqueos', element: <Navigate to="/admin/reservas" replace /> },
      { path: 'usuarios', lazy: async () => ({ Component: (await import('../components/Admin/AdminUsers')).AdminUsers }) },
      { path: 'contenido', lazy: async () => ({ Component: (await import('../components/Admin/AdminContent')).AdminContent }) },
      { path: 'plugins', lazy: async () => ({ Component: (await import('../components/Admin/AdminPlugins')).AdminPlugins }) },
      { path: 'sitio', lazy: async () => ({ Component: (await import('../components/Admin/AdminSite')).AdminSite }) },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/admin" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
