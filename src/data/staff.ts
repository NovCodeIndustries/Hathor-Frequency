/** Dominio de los correos del equipo (usuarios del panel) */
export const staffDomain = 'hathorfrequency.mx'

/** Minúsculas, sin acentos ni ñ, sin espacios ni signos: "Núñez de la O" → "nunezdelao" */
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/**
 * Parte local del correo de un usuario del panel: primera letra del primer nombre + primer apellido
 * ("José" + "Núñez" → "jnunez"). Vacía si falta alguno de los dos.
 */
export function staffEmailLocal(firstName: string, lastName: string): string {
  const first = slug(firstName).charAt(0)
  const last = slug(lastName)
  return first && last ? `${first}${last}` : ''
}

/** Correo completo de un usuario nuevo: "jnunez@hathorfrequency.mx"; si ya existe, la API agrega 2, 3… */
export const staffEmail = (firstName: string, lastName: string) => {
  const local = staffEmailLocal(firstName, lastName)
  return local ? `${local}@${staffDomain}` : ''
}
