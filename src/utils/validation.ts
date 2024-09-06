import express from 'express'
import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'

// cái kiểu của validations lấy ở đâu
// ấn vào cái checkSchema bên cái user.middleware để lấy kiểu dữ liệu
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // for (const validation of validations) {
    //   const result = await validation.run(req)
    //   if (!result.isEmpty()) {
    //     return res.status(400).json({ errors: result.array() })
    //   }
    // }
    await validations.run(req) // check lỗi
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() })
    }
    next()
  }
}
