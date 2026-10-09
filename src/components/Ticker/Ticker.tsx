import { Fragment } from 'react'
import { tickerItems } from '../../data/site'
import { useSeason } from '../../lib/useSeason'
import './Ticker.css'

/** Una mitad de la pista: la secuencia repetida dos veces */
function TickerHalf({ items, sep, special }: { items: string[]; sep: string; special?: string }) {
  return (
    <div className="hf-ticker__half">
      {[0, 1].map((rep) =>
        items.map((item) => (
          <Fragment key={`${rep}-${item}`}>
            <span className={item === special ? 'hf-ticker__season' : undefined}>{item}</span>
            <span className="hf-ticker__sep">{sep}</span>
          </Fragment>
        )),
      )}
    </div>
  )
}

export function Ticker() {
  const season = useSeason()
  // En temporada se suma su palabra a la mitad de la secuencia y cambia el separador
  const special = season?.page.ticker
  const items = special ? [...tickerItems.slice(0, 2), special, ...tickerItems.slice(2)] : tickerItems
  const sep = season?.page.sep ?? '◆'
  return (
    <div className="hf-ticker" role="marquee" aria-label={items.join(', ')}>
      {/* Dos mitades idénticas: translateX(-50%) cierra el bucle sin salto */}
      <div className="hf-ticker__track" aria-hidden="true">
        <TickerHalf items={items} sep={sep} special={special} />
        <TickerHalf items={items} sep={sep} special={special} />
      </div>
    </div>
  )
}
