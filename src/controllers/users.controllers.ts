import { Request, Response } from 'express'
import userSevice from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'
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
// hover vào cái req => copy kiểu dữ liệu của nó
// cái any đầu tiên là cái req. gì đó
// tìm đến cái req.body để định kiểu dữ liệu cho nó ()
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await userSevice.register(req.body)
    return res.json({
      message: 'Register success',
      result,
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Register Failed',
      error,
    })
  }
}
