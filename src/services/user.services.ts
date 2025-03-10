import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { RegisterReqBody, updateMeReqBody } from '~/models/requests/User.request'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
import { PassThrough } from 'stream'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
dotenv.config()
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify,
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_ACCESS_TOKEN as string,
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_REFRESH_TOKEN as string,
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
      },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_EMAIL_VERIFY_TOKEN as string,
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
      },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN as string,
    })
  }
  private signAccessTokenAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  async register(payload: RegisterReqBody) {
    // tạo user id = code luôn
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id.toString()), token: refresh_token }),
    )
    console.log('sernd email: ', email_verify_token)
    return {
      access_token,
      refresh_token,
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id,
      verify: verify,
    })
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }))
    return {
      access_token,
      refresh_token,
    }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: 'logout success',
    }
  }
  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },

      {
        $set: {
          email_verify_token: '',
          // updated_at: '$$NOW',
          verify: UserVerifyStatus.Verified,
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id,
      verify: UserVerifyStatus.Verified,
    })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }),
    )

    return {
      access_token,
      refresh_token,
    }
  }
  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id,
      verify: UserVerifyStatus.Unverified,
    })
    console.log('🚀 ~ UsersService ~ resendEmailVerify ~ email_verify_token:', email_verify_token)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },

      {
        $set: {
          email_verify_token,
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    return {
      message: 'Resend email verify success',
    }
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify,
    })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          forgot_password_token,
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    // gửi email => ch làm
    console.log('forgot token : ', forgot_password_token)
    return {
      message: 'Forgot password success',
    }
  }
  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    return {
      message: 'Reset password success',
    }
  }
  async me(user_id: string) {
    const user = await databaseService.users.findOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
        },
      },
    )
    return user
  }
  async updateMe(user_id: string, body: updateMeReqBody) {
    const _payload = body.date_of_birth ? { ...body, date_of_birth: new Date(body.date_of_birth) } : { ...body }
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          ...(_payload as updateMeReqBody & { date_of_birth: Date }),
        },
        $currentDate: {
          updated_at: true,
        },
      },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
        },
        returnDocument: 'after',
      },
    )
    return user
  }
  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    })
    if (follower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id),
        }),
      )
      return {
        message: 'Follow success',
      }
    }
    return {
      message: 'Already following this user.',
    }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    })
    if (follower === null) {
      return {
        message: 'Already not following this user.',
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    })
    return {
      message: 'unfollow success',
    }
  }
  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          password: hashPassword(new_password),
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    return {
      message: 'Change password success',
    }
  }
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      grantType: 'authorization_code',
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return data as {
      access_token: string
      id_token: string
    }
  }
  private async getGGUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      params: {
        access_token,
        alt: 'json',
      },
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    })
    return data as {
      sub: string
      name: string
      given_name: string
      family_name: string
      picture: string
      email: string
      email_verified: boolean
    }
  }
  async oauth(code: string) {
    const { id_token, access_token } = await this.getOAuthGoogleToken(code)
    // data có cái id token => có thể call thêm 1 lần nữa lên gg api để lấy tt user
    // hoặc là lấy dựa vào decode cái idTOken ra
    const user = await this.getGGUserInfo(access_token, id_token)
    if (!user.email_verified) {
      throw new ErrorWithStatus({
        message: 'Gmail not verified',
        status: HTTP_STATUS.BAD_REQUEST,
      })
    }
    const userInDB = await databaseService.users.findOne({ email: user.email })
    // tồn tại thì cho login vào
    if (userInDB) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: userInDB._id.toString(),
        verify: userInDB.verify,
      })
      databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: new ObjectId(userInDB._id), token: refresh_token }),
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: userInDB.verify,
      }
    } else {
      const randomPass = Math.random().toString(36).substring(2, 15)
      const data = await this.register({
        email: user.email,
        password: randomPass,
        confirm_password: randomPass,
        name: user.name,
        date_of_birth: new Date().toISOString(),
      })
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified,
      }
    }
  }
  async refreshToken(user_id: string, verify: UserVerifyStatus, refresh_token: string) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token }),
    ])
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token }),
    )
    return {
      new_access_token,
      new_refresh_token,
    }
  }
}
const userSevice = new UsersService()
export default userSevice
