import fs from 'fs'
import path from 'path'
export const initFolder = () => {
  if (!fs.existsSync(path.resolve('uploads/images'))) {
    fs.mkdirSync(path.resolve('uploads/images'), {
      recursive: true,
    })
  }
}
