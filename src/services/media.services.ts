import { Request } from 'express'
import { getNameFromFullname, handleUploadSingleImage } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
config()
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    // chuyển cái file thành test.jpg trong thư mục uploads
    const newPath = getNameFromFullname(file.newFilename)
    const newDir = path.resolve('uploads/', `${newPath}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newDir)
    // xóa file tmp
    fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/medias/${newPath}.jpg`
      : `http://localhost:${process.env.PORT}/medias/${newPath}.jpg`
  }
}
const mediasService = new MediasService()

export default mediasService
