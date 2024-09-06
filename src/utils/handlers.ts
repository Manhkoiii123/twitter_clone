import { NextFunction, Request, RequestHandler, Response } from 'express'
// type Func = (req: Request, res: Response, next: NextFunction) => Promise<void>
export const wrapRequestHandler = (func: RequestHandler) => {
  // cái func chính là cái controller này
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
