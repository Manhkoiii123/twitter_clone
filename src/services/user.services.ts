import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { RegisterReqBody, updateMeReqBody } from '~/models/requests/User.request'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
import { PassThrough } from 'stream'
import Follower from '~/models/schemas/Follower.schema'
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
        expiresIn: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN,
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
}
const userSevice = new UsersService()
export default userSevice
