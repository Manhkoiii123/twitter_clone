import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SERCET as string,
  options = {
    expiresIn: '1d',
    algorithm: 'HS256',
  },
}: {
  payload: string | object | Buffer
  privateKey?: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      resolve(token as string)
    })
  })
}
