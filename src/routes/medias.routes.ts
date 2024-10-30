import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRoute = Router()
mediasRoute.post('/upload-image', wrapRequestHandler(uploadSingleImageController))

export default mediasRoute
