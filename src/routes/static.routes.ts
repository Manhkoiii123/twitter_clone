import { Router } from 'express'
import {
  serveImageController,
  serveVideoController,
  serveVideoStreamController,
} from '~/controllers/static.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const staticRoute = Router()

staticRoute.get('/image/:name', wrapRequestHandler(serveImageController))
staticRoute.get('/video-stream/:name', wrapRequestHandler(serveVideoStreamController))
// staticRoute.get('/video/:name', wrapRequestHandler(serveVideoController))
export default staticRoute
