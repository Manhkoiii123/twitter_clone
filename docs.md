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

# Tạo Access Token và Refresh Token

tạo `models/requests/User.request.ts` để định nghĩa inteface body gửi lên

```ts
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
```

sang `user.controller.ts`

```ts
// hover vào cái req => copy kiểu dữ liệu của nó
// cái any đầu tiên là cái req. gì đó
// tìm đến cái req.body để định kiểu dữ liệu cho nó ()
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  // const { email, password, confirm_password, date_of_birth, name } = req.body
  try {
    const result = await userSevice.register(req.body)
    return res.json({
      message: 'Register success',
      result,
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Register Failed',
      error,
    })
  }
}
```

sang cái `user.services.ts`

```ts
import { RegisterReqBody } from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'

class UsersService {
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    return result
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}
const userSevice = new UsersService()
export default userSevice
```

## hash password

tạo `utils/crypto.ts`

```ts
import { createHash } from 'crypto'

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
export const hashPassword = (pass: string) => {
  return sha256(pass + process.env.PASSWORD_SERCET)
}
```

sử dụng trong `user.services`

```ts
async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    return result
  }
```

## tạo token

`npm i jsonwebtoken`

viết `utils/jwt.ts`

```ts
import jwt from 'jsonwebtoken'

export const signToken = ({
  payload,
  privateKey = process.env.JWT_SERCET as string, // chuỗi bất kì
  options = {
    expiresIn: '1d',
    algorithm: 'HS256',
  },
}: {
  payload: string | object | Buffer
  privateKey?: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      resolve(token as string)
    })
  })
}
```

sử dụng trong `user.services.ts`

```ts
import { TokenType } from '~/constants/enums'
import { RegisterReqBody } from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'

class UsersService {
  private signAccessToken(userId: string) {
    return signToken({
      payload: {
        userId,
        token_type: TokenType.AccessToken,
      },
    })
  }
  private signRefreshToken(userId: string) {
    return signToken({
      payload: {
        userId,
        token_type: TokenType.RefreshToken,
      },
    })
  }
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    const userId = result.insertedId.toString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId),
    ])

    return {
      access_token,
      refresh_token,
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}
const userSevice = new UsersService()
export default userSevice
```

# Bài 85: Error Handle trong Express.js (lí thuyết)

có 2 loại handler

## request handle

nhận request từ client và trả về response (ví dụ như cái controller của mình)

là 1 func nhận 3 tham số (req,res,next)

nếu ko dùng next thì ko cần khai báo cũng được

ví dụ

```ts
app.use('/users', (req, res, next) => {
  res.send('hello world')
})
```

1. gọi `next()` ko có tham số => chuyển sang cái request handle tiếp theo

```ts
usersRouter.post('/register', registerValidator, registerController)
```

thì chạy xong cái `reVal` sẽ chạy đến cái `resController`

nếu ko có next thì nó sẽ dừng mãi ở cái request handle đó

2. nếu có tham số `next(err)` => chuyển sang `error handle`

## error handle

nhận error từ reqest handle và trả về response

là 1 fun nhận vào 4 tham số (bắt buộc) là err, req,res,next

```ts
app.use((err, req, res, next) => {
  if (err) {
    //do
    res.status(400).send('Error')
  }
})
```

ví dụ

```ts
...(req,res,next) => { (1)
  // throw new Error(loi) cũng như cái dưới
  next(new Error("loi")) // nó sẽ bỏ qua các cái request handle dưới chạy thẳng xuống cái error handle
},
// .... có nhiều cái request handle nữa
(err,req,res,next) => {
  res.status(400).send('Error')
}
```

nếu trong cái (1) nó sẽ async function => throw ko ăn nữa => đưa cái lỗi vào try catch rồi next nó

```ts
aysnc(req,res,next) => {
  try{
    throe new Error('ss')
  }catch(err){
    next(err)
  }
}
```

![alt text](image.png)

hoặc là

![alt text](image-1.png)

# Bài 86: Tạo wrapRequestHandler để xử lý lỗi

vấn đề: thấy cái phần xử lí lỗi lúc nào cũng res.status... => quy về 1 cái next() thôi

ví dụ

```ts
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await userSevice.register(req.body)
    return res.json({
      message: 'Register success',
      result,
    })
  } catch (error) {
    //phần này này
    // return res.status(400).json({
    //   message: 'Register Failed',
    //   error,
    // })

    next(error) // => thế này thôi
  }
}
```

bên `user.route.ts`

```ts
usersRouter.post('/register', registerValidator, registerController, (err, req, res, next) => {
  console.log(err)
  res.status(400).json({ error: err.message })
})
```

vẫn ch tối ưu

=> tập trung cho cả app => khai báo middleware bên `index.ts` (file to nhất)

```ts
import express, { NextFunction, Request, Response } from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.service'
const app = express()
const port = 3000
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
databaseService.connect()
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
  res.status(404).json({ error: err.message })
})
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
```

tiếp tục tối ưu: chả nhẽ cái controller nào cũng try catch

tạo 1 function bọc lại cái controller này

tạo `utlis/handles.ts`

```ts
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
```

khi sử dụng thì muốn dùng như sau

```ts
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
```

và bên cái `registerController` k cần cái try catch nữa

```ts
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const result = await userSevice.register(req.body)
  return res.json({
    message: 'Register success',
    result,
  })
}
```

# Bài 87: Chuẩn hóa bộ xử lý lỗi
