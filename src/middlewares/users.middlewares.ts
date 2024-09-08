import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.service'
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
        notEmpty: {
          errorMessage: 'AccessToken is required',
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: 'AccessToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_authorization = await verifyToken({ token: access_token })
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
        notEmpty: {
          errorMessage: 'RefreshToken is required',
        },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
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
