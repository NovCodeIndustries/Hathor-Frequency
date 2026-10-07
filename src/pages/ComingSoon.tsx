import { Button } from '../components/shared/Button'
import { Eyebrow } from '../components/shared/Eyebrow'
import { GoldText } from '../components/shared/GoldText'
import { VinylRings } from '../components/shared/VinylRings'
import './ComingSoon.css'

interface ComingSoonProps {
  eyebrow: string
  title: string
}

/** Página provisional (Estudio aún no tiene diseño; 404) */
export function ComingSoon({ eyebrow, title }: ComingSoonProps) {
  return (
    <section className="hf-soon" aria-labelledby="soon-title">
      <VinylRings
        className="hf-soon__rings"
        size={420}
        radii={[205, 180, 155, 130, 105, 80]}
        strokeOpacity={0.6}
        center={{ r: 40, opacity: 0.5, dot: 4 }}
      />
      <Eyebrow both>{eyebrow}</Eyebrow>
      <h1 id="soon-title" className="hf-h2">
        <GoldText strong>{title}</GoldText>
      </h1>
      <Button variant="ghost" to="/">Volver al inicio</Button>
    </section>
  )
}
