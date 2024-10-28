import { Router } from 'express'
import {
  emailVerifyController,
  forgorPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  verifyForgotPasswordController,
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordValidator,
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()
usersRouter.use((req, res, next) => {
  next()
})
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgorPasswordController))
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController),
)
export default usersRouter
