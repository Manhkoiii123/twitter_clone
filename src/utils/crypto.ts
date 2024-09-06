import { createHash } from 'crypto'

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
export const hashPassword = (pass: string) => {
  return sha256(pass + process.env.PASSWORD_SERCET)
}
