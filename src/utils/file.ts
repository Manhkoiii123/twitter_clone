import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'
export const initFolder = () => {
  if (!fs.existsSync(path.resolve('uploads/temp'))) {
    fs.mkdirSync(path.resolve('uploads/temp'), {
      recursive: true,
    })
  }
}
export const handleUploadSingleImage = async (req: Request) => {
  // const form = (await import('formidable)).default
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 1,
    maxFileSize: 300 * 1024, // 300kb
    keepExtensions: true, // ko lấy đuôi mở rộng của file (nếu nó là false)
    filter: function ({ name, originalFilename, mimetype }) {
      // name là cái key truyền lên trên form data
      // originalFilename là tên file upload gốc
      // mimetype :type của cái up lên
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
  })
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve((files.image as File[])[0])
    })
  })
}
export const getNameFromFullname = (fullname: string) => {
  const name = fullname.split('.')
  name.pop()
  return name.join('')
}
