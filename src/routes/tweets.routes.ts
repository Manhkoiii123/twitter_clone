import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { createTweetValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController),
)
export default tweetsRouter
