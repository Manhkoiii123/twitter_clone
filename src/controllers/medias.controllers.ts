import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
// cái này sẽ lấy ra được cái url dẫn đến cái thư mục đang chứa cái code của mình D:\01_nodejs\twitter_clone\uploads
// muốn là nó lưu vào 1 cái url khi upload lên
// console.log(path.resolve(''))
export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  // const form = (await import('formidable)).default
  const form = formidable({
    uploadDir: path.resolve('uploads'),
    maxFiles: 1,
    maxFileSize: 300 * 1024, // 300kb
    keepExtensions: true, // ko lấy đuôi mở rộng của file (nếu nó là false)
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      throw err
    }
    res.json({
      message: 'Upload single image success',
      fields,
      files,
    })
  })
}
