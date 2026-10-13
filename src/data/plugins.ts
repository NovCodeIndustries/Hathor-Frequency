import type { Plugin } from './types'

// TODO: nombres, descripciones, precios y demos reales (los [..] son marcadores); se editan en panel · Plugins

export const pluginsIntro = 'Cada plugin es un pedal de la pedalera del estudio: lo usamos en nuestras sesiones antes de compartirlo.'

export const plugins: Plugin[] = [
  {
    id: 'plugin-01',
    name: '[Plugin 01]',
    category: 'Dinámica',
    status: 'available',
    short: '[Qué hace, en una línea.]',
    description: '[Qué hace y para qué lo usan en el estudio, en dos o tres líneas.]',
    formats: ['VST3', 'AU', 'AAX'],
    systems: ['macOS', 'Windows'],
    free: false,
    price: '$[PRECIO]',
    link: '',
    controls: ['Input', 'Ratio', 'Attack', 'Mix'],
  },
  {
    id: 'plugin-02',
    name: '[Plugin 02]',
    category: 'EQ',
    status: 'available',
    short: '[Qué hace, en una línea.]',
    description: '[Qué hace y para qué lo usan en el estudio, en dos o tres líneas.]',
    formats: ['VST3', 'AU'],
    systems: ['macOS', 'Windows'],
    free: true,
    price: '',
    link: '',
    controls: ['Low', 'Mid', 'High', 'Out'],
  },
  {
    id: 'plugin-03',
    name: '[Plugin 03]',
    category: 'Saturación',
    status: 'beta',
    short: '[Qué hace, en una línea.]',
    description: '[Qué hace y para qué lo usan en el estudio, en dos o tres líneas.]',
    formats: ['VST3'],
    systems: ['macOS', 'Windows'],
    free: true,
    price: '',
    link: '',
    controls: ['Drive', 'Tone', 'Mix'],
  },
  {
    id: 'plugin-04',
    name: '[Plugin 04]',
    category: 'Reverb',
    status: 'soon',
    short: '[Qué hace, en una línea.]',
    description: '[Qué hace y para qué lo usan en el estudio, en dos o tres líneas.]',
    formats: [],
    systems: [],
    free: false,
    price: '',
    link: '',
    controls: ['Size', 'Decay', 'Pre', 'Mix'],
  },
]

export const pluginStatusLabel = { available: 'Disponible', beta: 'Beta', soon: 'Próximamente' } as const
export const pluginFormats = ['VST3', 'AU', 'AAX', 'CLAP'] as const
export const pluginSystems = ['macOS', 'Windows', 'Linux'] as const
