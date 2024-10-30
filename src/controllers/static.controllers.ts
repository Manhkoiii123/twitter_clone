import { NextFunction, Request, Response } from 'express'
import path from 'path'

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve('uploads/', name), (err) => {
    if (err) {
      res.status((err as any).status).send('Image not found')
    }
  })
}
