import { Request, Response } from 'express'
import userSevice from '~/services/user.services'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'manh@gmail.com' && password === '1') {
    return res.status(200).json({
      message: 'login successfully',
    })
  }
  return res.status(400).json({
    message: 'login failed',
  })
}
export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    await userSevice.register({ email, password })
    return res.json({
      message: 'Register success',
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Register Failed',
      error,
    })
  }
}
