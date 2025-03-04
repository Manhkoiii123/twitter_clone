import { Router } from 'express'
import { bookmarkTweetController, unbookmarkTweetController } from '~/controllers/bookmark.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRoute = Router()
// tạo bookmark
bookmarkRoute.post('', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(bookmarkTweetController))
// un bookmark
bookmarkRoute.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unbookmarkTweetController),
)
export default bookmarkRoute
