/**
 * Alta o cambio de contraseña de una persona del panel.
 *   npm run admin:create
 *   docker compose exec app npm run admin:create
 */
import 'dotenv/config'
import { Writable } from 'node:stream'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline'
import { hashPassword } from '../auth'
import { prisma } from '../../shared/db'

// Salida silenciable para no mostrar la contraseña al escribirla
let muted = false
const output = new Writable({
  write(chunk, _enc, done) {
    if (!muted) stdout.write(chunk)
    done()
  },
})
const lines = createInterface({ input: stdin, output, terminal: stdin.isTTY })[Symbol.asyncIterator]()

async function ask(prompt: string, hidden = false): Promise<string> {
  stdout.write(prompt)
  muted = hidden
  const { value = '' } = await lines.next()
  muted = false
  if (hidden) stdout.write('\n')
  return value
}

const email = (await ask('Correo: ')).trim().toLowerCase()
const name = (await ask('Nombre: ')).trim()
const password = await ask('Contraseña (mín. 10 caracteres): ', true)
stdin.pause()

if (!email.includes('@') || !name || password.length < 10) {
  console.error('Datos inválidos: correo, nombre y contraseña de al menos 10 caracteres.')
  process.exit(1)
}

const passwordHash = await hashPassword(password)
const user = await prisma.adminUser.upsert({
  where: { email },
  create: { email, name, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), passwordHash },
  update: { name, passwordHash },
})
// Al cambiar la contraseña se cierran las sesiones abiertas
await prisma.adminSession.deleteMany({ where: { userId: user.id } })
console.info(`✔ Admin listo: ${user.name} <${user.email}>`)
await prisma.$disconnect()
process.exit(0)
