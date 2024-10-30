import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
const mediasRoute = Router()
mediasRoute.post('/upload-image', uploadSingleImageController)

export default mediasRoute
