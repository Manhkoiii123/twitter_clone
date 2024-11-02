import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'
export const initFolder = () => {
  ;[path.resolve('uploads/images/temp'), path.resolve('uploads/videos/temp')].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      })
    }
  })
}
export const handleUploadImage = async (req: Request) => {
  // const form = (await import('formidable)).default
  const form = formidable({
    uploadDir: path.resolve('uploads/images/temp'),
    maxFiles: 4,
    maxFileSize: 300 * 1024, // 300kb
    maxTotalFileSize: 3000 * 1024 * 4,
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
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        // đây là cái key truyền lên ở cái form data
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}
export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads/videos'),
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 300kb
    //sau khi bỏ cái keepExtensions thì nó sẽ ko lấy đuôi mở rộng của file => handle việc lấy đuôi => rename file đó
    filter: function ({ name, originalFilename, mimetype }) {
      return true
    },
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        //files.video : => video  là cái key truyền lên ở cái form data
        return reject(new Error('File is empty'))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const extension = getExtensionFromFullname(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + extension)
        video.newFilename = video.newFilename + '.' + extension
      })
      resolve(files.video as File[])
    })
  })
}
export const getNameFromFullname = (fullname: string) => {
  const name = fullname.split('.')
  name.pop()
  return name.join('')
}
export const getExtensionFromFullname = (fullname: string) => {
  const name = fullname.split('.')
  return name[name.length - 1]
}
