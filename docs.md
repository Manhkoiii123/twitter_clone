# Dùng checkSchema để valide body register = thư viện express validator

đọc docs => `schema validation` của thư viện nhìn nó trực quan và dễ nhìn hơn

viết 1 cái middleware trong `user.middleware`

```ts
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    })
  }
  next()
}
export const registerValidator = checkSchema({
  name: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: { min: 1, max: 100 },
    },
    trim: true,
  },
  email: {
    notEmpty: true,
    isEmail: true,
    trim: true,
  },
  password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: { min: 6, max: 100 },
    },
    isStrongPassword: {
      options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    },
  },
  confirm_password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: { min: 6, max: 100 },
    },
    isStrongPassword: {
      options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    },
  },
  date_of_birth: {
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true,
      },
    },
  },
})
```

sử dụng ben cái `user.routes.ts`

```ts
usersRouter.post('/register', registerValidator, registerController)
```

vẫn chưa xuất ra lỗi cho mình => đọc docs `manually running validations`

docs `https://express-validator.github.io/docs/guides/manually-running#example-creating-own-validation-runner`

=> validate check cái lỗi trong `registerValidator` => ko cho chạy đến controller nữa

tạo 1 file `utils/validation.ts`

```ts
import express from 'express'
import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'

// cái kiểu của validations lấy ở đâu
// ấn vào cái checkSchema bên cái user.middleware để lấy kiểu dữ liệu
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validations.run(req) // check lỗi
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() })
    }
    next()
  }
}
```

khi đó sử dụng bên cái `user.middleware`

```ts
export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: 'Name is required',
        bail: true,
      },
      isString: true,
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: 'Name must be between 1 and 100 characters',
      },
      trim: true,
    },
    email: {
      notEmpty: {
        errorMessage: 'Email is required',
        bail: true,
      },
      isEmail: {
        errorMessage: 'Email is not valid',
      },
      trim: true,
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters',
      },
      isStrongPassword: {
        options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 100 },
        errorMessage: 'Password must be between 6 and 100 characters',
      },
      isStrongPassword: {
        options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirm does not match password')
          }
          return true
        },
      },
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true,
        },
      },
    },
  }),
)
```

khi đó call api register mà có lỗi (ví dụ như trong body ko truyền lên cái gì) thì trả ra như sau

```json
{
  "errors": {
    "date_of_birth": {
      "type": "field",
      "msg": "Invalid value",
      "path": "date_of_birth",
      "location": "body"
    },
    "email": {
      "type": "field",
      "msg": "Invalid value",
      "path": "email",
      "location": "body"
    },
    "name": {
      "type": "field",
      "msg": "Invalid value",
      "path": "name",
      "location": "body"
    },
    "password": {
      "type": "field",
      "msg": "Invalid value",
      "path": "password",
      "location": "body"
    },
    "confirm_password": {
      "type": "field",
      "msg": "Invalid value",
      "path": "confirm_password",
      "location": "body"
    }
  }
}
```

# Kiểm tra email có tồn tại hay ko

thêm cái custom trong cái validator email của registor

```ts
email: {
      notEmpty: {
        errorMessage: 'Email is required',
        bail: true,
      },
      isEmail: {
        errorMessage: 'Email is not valid',
      },
      trim: true,
      custom: {
        options: async (value) => {
          const res = await userSevice.checkEmailExist(value)
          if (res) {
            return Promise.reject('Email already exists')
          }
          return true
        },
      },
    },
```

hàm `userSevice.checkEmailExist(value)`

```ts
async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
```
