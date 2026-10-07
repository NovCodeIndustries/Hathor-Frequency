import { Fragment } from 'react'
import { tickerItems } from '../../data/site'
import './Ticker.css'

/** Una mitad de la pista: la secuencia repetida dos veces */
function TickerHalf() {
  return (
    <div className="hf-ticker__half">
      {[0, 1].map((rep) =>
        tickerItems.map((item) => (
          <Fragment key={`${rep}-${item}`}>
            <span>{item}</span>
            <span className="hf-ticker__sep">◆</span>
          </Fragment>
        )),
      )}
    </div>
  )
}

export function Ticker() {
  return (
    <div className="hf-ticker" role="marquee" aria-label={tickerItems.join(', ')}>
      {/* Dos mitades idénticas: translateX(-50%) cierra el bucle sin salto */}
      <div className="hf-ticker__track" aria-hidden="true">
        <TickerHalf />
        <TickerHalf />
      </div>
    </div>
  )
}
