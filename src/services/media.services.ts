import { Request } from 'express'
import { getNameFromFullname, handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Orther'
config()
class MediasService {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const res: Media[] = await Promise.all(
      files.map(async (file) => {
        // chuyển cái file thành test.jpg trong thư mục uploads
        const newPath = getNameFromFullname(file.newFilename)
        const newDir = path.resolve('uploads/', `${newPath}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newDir)
        // xóa file tmp
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newPath}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newPath}.jpg`,
          type: MediaType.Image,
        }
      }),
    )
    return res
  }
}
const mediasService = new MediasService()

export default mediasService
