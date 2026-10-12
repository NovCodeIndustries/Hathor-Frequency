/** Minúsculas, sin acentos ni ñ, sin espacios ni signos: "Núñez de la O" → "nunezdelao" */
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/**
 * Usuario para entrar al panel: primera letra del primer nombre + primer apellido
 * ("José" + "Núñez" → "jnunez"); si ya existe, la API agrega 2, 3… Vacío si falta alguno de los dos.
 */
export function staffUsername(firstName: string, lastName: string): string {
  const first = slug(firstName).charAt(0)
  const last = slug(lastName)
  return first && last ? `${first}${last}` : ''
}

/** Lo que se escribe en el login, normalizado: minúsculas y sin dominio ("FRuiz@hathorfrequency.mx" → "fruiz") */
export const normalizeUsername = (raw: string) => raw.trim().toLowerCase().split('@')[0]
