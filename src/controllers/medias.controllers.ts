import { NextFunction, Request, Response } from 'express'
import { handleUploadSingleImage } from '~/utils/file'
// cái này sẽ lấy ra được cái url dẫn đến cái thư mục đang chứa cái code của mình D:\01_nodejs\twitter_clone\uploads
// muốn là nó lưu vào 1 cái url khi upload lên
// console.log(path.resolve(''))
export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadSingleImage(req)
  return res.json({ data })
}
