import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}
// dành cho 422
// type ErrorsType = Record<string, string> // sẽ có dạng {[key:string] : string}
// cái obj phía sau phụ thuộc vào cái mà lỗi trả về (ví dụ đang dùng validator của express nó trả ra thế kia)
type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = USER_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    // status luôn là 422
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
