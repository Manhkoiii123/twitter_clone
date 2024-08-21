import { Request, Response } from 'express'

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
