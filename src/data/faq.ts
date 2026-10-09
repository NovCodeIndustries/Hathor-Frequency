import type { Faq } from './types'

// TODO: completar los marcadores [..] con los datos reales
// Las preguntas se muestran agrupadas por categoría, en este orden.
export const faqs: Faq[] = [
  // Reservas y tiempos
  {
    category: 'Reservas y tiempos',
    q: '¿Cómo puedo reservar una sesión de grabación?',
    a: 'Puedes apartar tu fecha contactándonos directamente a través de nuestras redes sociales, WhatsApp o correo electrónico. Las sesiones se confirman mediante un anticipo (depósito/transferencia) para asegurar el horario en nuestra agenda.',
  },
  {
    category: 'Reservas y tiempos',
    q: '¿Con cuánta anticipación debo agendar mi estudio?',
    a: 'Recomendamos reservar con al menos una a dos semanas de anticipación para tener margen de planear la sesión, organizar los requerimientos técnicos y asegurarnos de que el estudio esté disponible en el horario que mejor te convenga.',
  },
  {
    category: 'Reservas y tiempos',
    q: '¿Qué pasa si necesito cancelar o reprogramar mi sesión?',
    a: 'Entendemos que pueden surgir imprevistos. Puedes reprogramar tu sesión sin cargo extra avisando con al menos 48 horas de anticipación. Las cancelaciones con menos tiempo o inasistencias pueden estar sujetas a la retención del anticipo.',
  },
  {
    category: 'Reservas y tiempos',
    q: '¿Cómo se paga?',
    a: 'Por depósito o transferencia [OTRAS FORMAS DE PAGO]. Para apartar la fecha pedimos un anticipo de [ANTICIPO].',
  },

  // Preparación y desarrollo
  {
    category: 'Preparación y desarrollo',
    q: '¿Qué necesito tener listo antes de entrar al estudio?',
    a: 'Para aprovechar al máximo el tiempo y tu presupuesto, es ideal que llegues con los temas ensayados, las letras impresas, las estructuras claras y las pistas guía o maquetas listas (si aplica). Cuanto más preparado vengas, más fluido será el proceso.',
  },
  {
    category: 'Preparación y desarrollo',
    q: '¿Puedo llevar instrumentos o equipos propios?',
    a: '¡Por supuesto! Aunque contamos con equipamiento profesional de alta gama, si tienes una guitarra, bajo o pedalera con la que te sientas cómodo y que defina tu sonido característico, te animamos a traerla.',
  },
  {
    category: 'Preparación y desarrollo',
    q: '¿Me pueden ayudar con los arreglos musicales o la producción si mi canción está a medias?',
    a: '¡Sí! No solo grabamos; también ofrecemos servicios de producción musical, dirección artística y arreglos para ayudar a que tu idea suene al siguiente nivel. Cuéntanos tu visión antes de la sesión para planearlo juntos.',
  },

  // Servicios y procesos
  {
    category: 'Servicios y procesos',
    q: '¿Qué incluye exactamente una tarifa por hora o por proyecto?',
    a: 'Generalmente incluye el uso de las instalaciones acústicas, el equipo del estudio, el ingeniero de grabación/técnico de sonido en cabina y el archivo crudo. Los servicios de mezcla y masterización pueden venir incluidos o cotizarse por separado.',
  },
  {
    category: 'Servicios y procesos',
    q: '¿Grabamos en vivo o por pistas?',
    a: 'Como mejor suene tu proyecto. Podemos grabar a toda la banda en vivo o instrumento por instrumento; lo platicamos antes de la sesión.',
  },
  {
    category: 'Servicios y procesos',
    q: '¿Cuánto tarda la entrega?',
    a: 'Depende del servicio o paquete. Cada paquete indica su tiempo de entrega; como referencia, una mezcla tarda [DÍAS].',
  },
  {
    category: 'Servicios y procesos',
    q: '¿Cómo y en qué formato se entregan los archivos finales?',
    a: 'Los temas mezclados y masterizados se entregan en formatos digitales de alta calidad (WAV a 24 bits / 44.1 kHz o superior para streaming) y los videos en MP4 de alta calidad (H.264 en Full HD 1080p o 4K), todo enviado a través de un enlace de descarga seguro.',
  },
  {
    category: 'Servicios y procesos',
    q: '¿Qué pasa si quiero hacer cambios a la mezcla después de la entrega?',
    a: 'Todos nuestros paquetes de mezcla y masterización incluyen un número determinado de revisiones (generalmente entre 2 y 3 rondas de ajustes menores) para asegurar que el resultado sea exacto. Cambios posteriores pueden tener costo extra.',
  },

  // Equipamiento y comodidades
  {
    category: 'Equipamiento y comodidades',
    q: '¿Qué tipo de equipo de grabación utilizan?',
    a: 'Trabajamos con interfaces profesionales, preamplificadores de alta gama, microfonía especializada para voz e instrumentos, monitores calibrados y estaciones de trabajo con los principales DAWs del mercado (Pro Tools, Ableton Live, FL Studio).',
  },
]
