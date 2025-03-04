import { Router } from 'express'
import { bookmarkTweetController } from '~/controllers/bookmark.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRoute = Router()
// tạo bookmark
bookmarkRoute.post('', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(bookmarkTweetController))
export default bookmarkRoute
