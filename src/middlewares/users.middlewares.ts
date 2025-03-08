import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.request'
import databaseService from '~/services/database.services'
import userSevice from '~/services/user.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: 'Email is required',
          bail: true,
        },
        isEmail: {
          errorMessage: 'Email is not valid',
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password),
            })
            if (user === null) {
              throw new Error('Email or password wrong')
            }
            //truyền user từ bên này sang bên controller
            req.user = user
            return true
          },
        },
      },
      password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: 'Password must be between 6 and 100 characters',
        },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      },
    },
    ['body'],
  ),
)
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: 'Name is required',
          bail: true,
        },
        isString: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Name must be between 1 and 100 characters',
        },
        trim: true,
      },
      email: {
        notEmpty: {
          errorMessage: 'Email is required',
          bail: true,
        },
        isEmail: {
          errorMessage: 'Email is not valid',
        },
        trim: true,
        custom: {
          options: async (value) => {
            const res = await userSevice.checkEmailExist(value)
            if (res) {
              throw new Error('Email already exists')
              // throw new ErrorWithStatus({
              //   message: 'Email already exists',
              //   status: 401,
              // })
            }
            return true
          },
        },
      },
      password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: 'Password must be between 6 and 100 characters',
        },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      },
      confirm_password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: 'Password must be between 6 and 100 characters',
        },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Password confirm does not match password')
            }
            return true
          },
        },
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true,
          },
        },
      },
    },
    ['body'],
  ),
)
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: 'AccessToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                privateKey: process.env.JWT_SERCET_ACCESS_TOKEN as string,
              })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            return true
          },
        },
      },
    },
    ['headers'],
  ),
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'RefreshToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, privateKey: process.env.JWT_SERCET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value }), //check trong db có ko
              ])
              if (refresh_token === null) {
                //ko thấy trong db
                throw new ErrorWithStatus({
                  message: 'RefreshToken used or not exist',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              // nếu ko xử lí thế này mà để mỗi 3 dòng throw trong if thì nó luôn rơi vào case này
              // muốn bắt cả case đã sử dụng ở trên (do nếu lỗi ở trên thì nó cũng tự rơi vào catch)
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'RefreshToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              throw error
            }
          },
        },
      },
    },
    ['body'],
  ),
)
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'EmailVerifyToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SERCET_EMAIL_VERIFY_TOKEN as string,
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'RefreshToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              throw error
            }
          },
        },
      },
    },
    ['body'],
  ),
)
export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: 'Email is required',
          bail: true,
        },
        isEmail: {
          errorMessage: 'Email is not valid',
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
            })
            if (user === null) {
              throw new Error('Email not found')
            }
            req.user = user
            return true
          },
        },
      },
    },
    ['body'],
  ),
)
export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'ForgotPasswordToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN as string,
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }) //check trong db có ko

              if (user === null) {
                //ko thấy trong db
                throw new ErrorWithStatus({
                  message: 'User not found',
                  status: HTTP_STATUS.NOT_FOUND,
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
            } catch (error) {
              // nếu ko xử lí thế này mà để mỗi 3 dòng throw trong if thì nó luôn rơi vào case này
              // muốn bắt cả case đã sử dụng ở trên (do nếu lỗi ở trên thì nó cũng tự rơi vào catch)
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              throw error
            }
          },
        },
      },
    },
    ['body'],
  ),
)
export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: 'Password must be between 6 and 100 characters',
        },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      },
      confirm_password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: 'Password must be between 6 and 100 characters',
        },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Password confirm does not match password')
            }
            return true
          },
        },
      },
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'ForgotPasswordToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN as string,
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }) //check trong db có ko

              if (user === null) {
                //ko thấy trong db
                throw new ErrorWithStatus({
                  message: 'User not found',
                  status: HTTP_STATUS.NOT_FOUND,
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              req.decoded_forgot_password_token = decoded_forgot_password_token
            } catch (error) {
              // nếu ko xử lí thế này mà để mỗi 3 dòng throw trong if thì nó luôn rơi vào case này
              // muốn bắt cả case đã sử dụng ở trên (do nếu lỗi ở trên thì nó cũng tự rơi vào catch)
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              throw error
            }
          },
        },
      },
    },
    ['body'],
  ),
)
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: 'User is not verified',
        status: HTTP_STATUS.FORBIDDEN,
      }),
    )
  }
  next()
}
export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Name must be between 1 and 100 characters',
        },
        trim: true,
      },
      date_of_birth: {
        optional: true,
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true,
          },
        },
      },
      bio: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 500 },
          errorMessage: 'Bio must be between 1 and 500 characters',
        },
      },
      website: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Website must be between 1 and 200 characters',
        },
      },
      username: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: 'Username must be between 1 and 50 characters',
        },
        custom: {
          options: async (value, { req }) => {
            const regex = /^(?![0-9]+$)[A-Za-z0-9_]{4,15}$/
            if (!regex.test(value)) {
              throw new ErrorWithStatus({
                message: 'Username is invalid',
                status: HTTP_STATUS.BAD_REQUEST,
              })
            }
            const user = await databaseService.users.findOne({ username: value })
            if (user) {
              throw Error('User already existed')
            }
          },
        },
      },
      avatar: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: 'Avatar must be between 1 and 400 characters',
        },
      },
      cover_photo: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: 'Avatar must be between 1 and 400 characters',
        },
      },
    },
    ['body'],
  ),
)
export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'FollowedUserId is invalid',
                status: HTTP_STATUS.NOT_FOUND,
              })
            }
            const followed_user = await databaseService.users.findOne({ _id: new ObjectId(value) })
            if (followed_user === null) {
              throw new ErrorWithStatus({
                message: 'FollowedUserId not found',
                status: HTTP_STATUS.NOT_FOUND,
              })
            }
          },
        },
      },
    },
    ['body'],
  ),
)
export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'user id is invalid',
                status: HTTP_STATUS.NOT_FOUND,
              })
            }
            const followed_user = await databaseService.users.findOne({ _id: new ObjectId(value) })
            if (followed_user === null) {
              throw new ErrorWithStatus({
                message: 'user id not found',
                status: HTTP_STATUS.NOT_FOUND,
              })
            }
          },
        },
      },
    },
    ['params'],
  ),
)
export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters',
      },
      isStrongPassword: {
        options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      custom: {
        options: async (value, { req }) => {
          const { user_id } = req.decoded_authorization as TokenPayload
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          if (!user) {
            throw new ErrorWithStatus({
              message: 'User not found',
              status: HTTP_STATUS.NOT_FOUND,
            })
          }
          const { password } = user
          const isMatch = hashPassword(value) === password
          if (!isMatch) {
            throw new ErrorWithStatus({
              message: 'Old password is incorrect',
              status: HTTP_STATUS.UNAUTHORIZED,
            })
          }
        },
      },
    },
    new_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters',
      },
      isStrongPassword: {
        options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
    },
    new_confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters',
      },
      isStrongPassword: {
        options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error('Password confirm does not match password')
          }
          return true
        },
      },
    },
  }),
)
