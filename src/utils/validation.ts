import express from 'express'
import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'

import { EntityError, ErrorWithStatus } from '~/models/Errors'

// cái kiểu của validations lấy ở đâu
// ấn vào cái checkSchema bên cái user.middleware để lấy kiểu dữ liệu
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validations.run(req) // check lỗi
    const errors = validationResult(req)
    //ko có lỗi => chạy tiếp luôn
    if (errors.isEmpty()) {
      return next()
    }
    // có lỗi
    const errorsObject = errors.mapped()
    const entityError = new EntityError({
      errors: {},
    })
    // lặp qua lỗi
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      // dòng dưới có nghĩa là msg có kiểu là ErrorWithStatus và có status !== 422 (thường là lỗi ko phải do validate)
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      //thường là lỗi validate
      // lỗi 422 rơi vào đây => add nó vào mảng entityError
      entityError.errors[key] = errorsObject[key]
    }

    next(entityError)
  }
}
