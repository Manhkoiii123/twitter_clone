import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { TokenPayload } from '~/models/requests/User.request'
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
export const verifyToken = ({
  token,
  privateKey = process.env.JWT_SERCET as string,
}: {
  token: string
  privateKey?: string
}) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    // hmf veri tham só thứ 3 là options || callback
    jwt.verify(token, privateKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as TokenPayload)
    })
  })
}
