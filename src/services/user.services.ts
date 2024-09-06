import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'

class UsersService {
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseService.users.insertOne(
      new User({
        email,
        password,
      }),
    )
    return result
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}
const userSevice = new UsersService()
export default userSevice
