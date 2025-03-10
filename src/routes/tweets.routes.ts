import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controllers'
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middleware'
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
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  accessTokenValidator,
  verifiedUserValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController),
)
export default tweetsRouter
