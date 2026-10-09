import type { Package } from '../../data/types'
import { Button } from '../shared/Button'
import { Drawer } from '../shared/Drawer'

interface PackageDrawerProps {
  pkg: Package
  onClose: () => void
}

/** Detalle completo del paquete */
export function PackageDrawer({ pkg, onClose }: PackageDrawerProps) {
  return (
    <Drawer kicker={`Paquete ${pkg.n} · ${pkg.tag}`} title={pkg.name} onClose={onClose}>
      <p className="hf-drawer__price">
        <span>{pkg.price}</span> MXN · [IVA]
      </p>
      <p className="hf-drawer__desc">{pkg.description}</p>

      <h3 className="hf-drawer__h3">Lado A · Incluye</h3>
      <ol className="hf-drawer__list">
        {pkg.includes.map((item, i) => (
          <li key={item}>
            <span>A{i + 1}</span>
            {item}
          </li>
        ))}
      </ol>

      <dl className="hf-drawer__meta">
        <div>
          <dt>Entrega:</dt>
          <dd>{pkg.delivery}</dd>
        </div>
        <div>
          <dt>Sesiones:</dt>
          <dd>{pkg.sessions}</dd>
        </div>
      </dl>

      <Button variant="primary" to="/reservar" block className="hf-drawer__cta">
        Reservar este paquete
      </Button>
    </Drawer>
  )
}
