import { NextFunction, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import HTTP_STATUS from '~/constants/httpStatus'

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params

  return res.sendFile(path.resolve('uploads/images', name), (err) => {
    if (err) {
      res.status((err as any).status).send('Image not found')
    }
  })
}
export const serveVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params

  res.sendFile(path.resolve('uploads/videos', name), (err) => {
    if (err && !res.headersSent) {
      res.status((err as any).status || 404).send('Video not found')
    }
  })
}
export const serveVideoStreamController = async (req: Request, res: Response, next: NextFunction) => {
  // ban đầu k tải hết video, load đến đâu tải đến đấy
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const { name } = req.params
  // đường dẫn video
  const videoPath = path.resolve('uploads/videos', name)
  //1 mb = 1000000 bytes tình theo hệ thập phân, hay thấy trên ui máy tính
  // nếu tính hệ nhị phân 2^20 = 1024
  //tính dung lượng video
  const videoSize = fs.statSync(videoPath).size
  // tính dung lượng 1 phân đoạn
  const CHUNK_SIZE = 10 ** 6 //1MB
  // tính vị trí bắt đầu của phân đoạn
  const start = Number(range.replace(/\D/g, ''))
  // tính vị trí kết thúc của phân đoạn

  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  const contentLength = end - start + 1
  // cài thư viện mime
  const mime = await import('mime')
  const contentType = mime.default.getType(videoPath) || 'video/*'
  // tạo header
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType,
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
