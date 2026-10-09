import type { Package } from '../../data/types'

interface PackageCardProps {
  pkg: Package
  onOpen: (trigger: HTMLButtonElement) => void
}

/** Portada de disco: funda con número y etiqueta, el disco asomando y la estampa del precio */
export function PackageCard({ pkg, onOpen }: PackageCardProps) {
  return (
    <button
      type="button"
      className="hf-pkg"
      aria-haspopup="dialog"
      onClick={(e) => onOpen(e.currentTarget)}
    >
      <span className="hf-pkg__art">
        <svg className="hf-pkg__disc" viewBox="0 0 210 210" fill="none" aria-hidden="true" focusable="false">
          <circle cx="105" cy="105" r="104" fill="#000" stroke="#333" />
          {[90, 76, 62].map((r) => (
            <circle key={r} cx="105" cy="105" r={r} stroke="#F2C94C" strokeOpacity="0.35" />
          ))}
          <circle cx="105" cy="105" r="34" fill="#F2C94C" fillOpacity="0.85" />
          <circle cx="105" cy="105" r="4" fill="#000" />
        </svg>
        <span className="hf-pkg__sleeve">
          <span className="hf-pkg__n">{pkg.n}</span>
          <span className="hf-pkg__tag">{pkg.tag}</span>
        </span>
        <span className="hf-pkg__sticker">
          <span>Desde</span>
          <strong>{pkg.price}</strong>
          <span>MXN</span>
        </span>
      </span>
      <span className="hf-pkg__body">
        <span className="hf-pkg__name">{pkg.name}</span>
        <span className="hf-pkg__short">{pkg.short}</span>
        <span className="hf-pkg__more">Ver contenido →</span>
      </span>
    </button>
  )
}
