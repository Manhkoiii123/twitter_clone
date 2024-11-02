import { NextFunction, Request, Response } from 'express'
import path from 'path'

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
