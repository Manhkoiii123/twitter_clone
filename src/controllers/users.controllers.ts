import { NextFunction, Request, Response } from 'express'
import userSevice from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  changePasswordBody,
  followReqBody,
  ForgorPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  unfollowReqParams,
  updateMeReqBody,
  VerifyEmailReqBody,
  VerifyForgorPasswordReqBody,
} from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { pick } from 'lodash'
import { config } from 'dotenv'
config()
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const { _id } = user
  const ans = await userSevice.login({
    user_id: _id.toString(),
    verify: user.verify,
  })
  return res.json({
    message: 'login success',
    ans,
  })
}
// hover vào cái req => copy kiểu dữ liệu của nó
// cái any đầu tiên là cái req. gì đó
// tìm đến cái req.body để định kiểu dữ liệu cho nó ()
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction,
) => {
  // throw new Error('loi ròi')
  const result = await userSevice.register(req.body)
  return res.json({
    message: 'Register success',
    result,
  })
}
export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { refresh_token } = req.body
  const result = await userSevice.logout(refresh_token)
  return res.json({
    message: result.message,
  })
}
export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id),
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'User not found',
    })
  }
  // đã verify rồi thì nó là '' thì mình sẽ ko báo lỗi mà trả về status OK với message là đã verify thành công trước đó rồi
  if (user.email_verify_token === '') {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Email already verified',
    })
  }
  const result = await userSevice.verifyEmail(user_id)
  return res.json({
    message: 'Email verify success',
    result,
  })
}
export const resendEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id),
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'User not found',
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Email already verified',
    })
  }
  const result = await userSevice.resendEmailVerify(user_id)
  return res.json(result)
}
export const forgorPasswordController = async (
  req: Request<ParamsDictionary, any, ForgorPasswordReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { _id } = req.user as User
  const result = await userSevice.forgotPassword({
    user_id: _id.toString(),
    verify: req.user!.verify,
  })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgorPasswordReqBody>,
  res: Response,
  next: NextFunction,
) => {
  return res.json({
    message: 'Verify forgot password success',
  })
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { password } = req.body
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const result = await userSevice.resetPassword(user_id, password)
  return res.json(result)
}
export const meController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await userSevice.me(user_id)
  return res.json({
    message: 'Get me success',
    result,
  })
}
export const updateMeController = async (
  req: Request<ParamsDictionary, any, updateMeReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  // cách 1 dùng lodash để lọc ra các trường gửi lên thôi. gửi lên linh tinh cũng ko nhận
  //cách 2 dùng middlewares (bên routes)
  const body = pick(req.body, [
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo',
  ])
  // const body = req.body
  const user = await userSevice.updateMe(user_id, body)
  return res.json({
    message: 'Update me success',
    user,
  })
}
export const followController = async (
  req: Request<ParamsDictionary, any, followReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const { followed_user_id } = req.body
  const result = await userSevice.follow(user_id, followed_user_id)
  return res.json(result)
}
export const unfollowController = async (req: Request<any, any, any>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const { user_id: followed_user_id } = req.params
  const result = await userSevice.unfollow(user_id, followed_user_id)
  return res.json(result)
}
export const changePasswordController = async (
  req: Request<any, any, changePasswordBody>,
  res: Response,
  next: NextFunction,
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { new_password } = req.body
  const result = await userSevice.changePassword(user_id, new_password)
  return res.json(result)
}
export const oauthController = async (req: Request<any, any, any>, res: Response, next: NextFunction) => {
  const { code } = req.query
  const result = await userSevice.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK as string}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&newUser=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}
export const refreshTokenController = async (
  req: Request<any, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload
  const { refresh_token } = req.body
  const result = await userSevice.refreshToken(user_id, verify, refresh_token)
  return res.json({
    message: 'refreshToken success',
    result,
  })
}
