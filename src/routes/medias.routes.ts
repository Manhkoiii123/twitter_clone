import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRoute = Router()
mediasRoute.post('/upload-image', wrapRequestHandler(uploadImageController))

export default mediasRoute
