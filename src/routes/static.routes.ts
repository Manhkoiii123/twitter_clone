import { Router } from 'express'
import { serveImageController } from '~/controllers/static.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const staticRoute = Router()

staticRoute.get('/image/:name', wrapRequestHandler(serveImageController))
export default staticRoute
