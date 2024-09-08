import { ObjectId } from 'mongodb'
import { TokenType } from '~/constants/enums'
import { RegisterReqBody } from '~/models/requests/User.request'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
dotenv.config()
class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      },
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      },
    })
  }
  private signAccessTokenAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    const userId = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(userId)
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(userId), token: refresh_token }))
    return {
      access_token,
      refresh_token,
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login(userId: string) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(userId)
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(userId), token: refresh_token }))
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
}
const userSevice = new UsersService()
export default userSevice
