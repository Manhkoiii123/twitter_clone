import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()
usersRouter.use((req, res, next) => {
  next()
})
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
/**
 * đăng kí
 * path:/users/register
 * method post
 * body: {name:string,email:string, password:string, confirm_pass:string,date_of_birth:isoString}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
export default usersRouter
