# Verify email

khi nguời dùng đăng kí => gửi email => ấn vào link => change status trạng thái người dùng

dạng đường link ` duthanhduoc.com/verify-email?email_verify_token=123123` => cleint call api với method post với url là `api-manh.com/verify_email` với body là `email_verify_token` => server nhận được `email_verify_token` => tìm user này là ai và change status tài khoản của user đó => trả về => `access_token` và `refresh_token` luôn để đăng nhập luôn || ko trả về gì để ng dùng phải đăng nhập lại

viết bên `users.middlewares.ts`

```ts
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'EmailVerifyToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            const decoded_email_verify_token = await verifyToken({
              token: value,
              privateKey: process.env.JWT_SERCET_EMAIL_VERIFY_TOKEN as string,
            })

            ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
          },
        },
      },
    },
    ['body'],
  ),
)
```

khai báo router bên `users.routes`

```ts
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
```

viết `controller`

```ts
export const emailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id),
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'User not found',
    })
  }
  // đã verify rồi thì nó là '' thì mình sẽ ko báo lỗi mà trả về status OK với message là đã verify thành công trước đó rồi
  if (user.email_verify_token === '') {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Email already verified',
    })
  }
  const result = await userSevice.verifyEmail(user_id)
  return res.json({
    message: 'Email verify success',
    result,
  })
}
```

bên `services` tạo thêm 1 hàm để verify email

```ts
private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
      },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_EMAIL_VERIFY_TOKEN as string,
    })
  }
```

viết hàm verify bên `service`

```ts
async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          email_verify_token: '',
          updated_at: new Date(),
          verify: UserVerifyStatus.Verified,
        },
      },
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id)

    return {
      access_token,
      refresh_token,
    }
  }
```

khi đó lúc register sẽ sử dụng như sau (chưa có send mail => tạm thời log ra đã)

```ts
 async register(payload: RegisterReqBody) {
    // tạo user id = code luôn
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth), // convert từ isoString sang date
      }),
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id.toString())
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id.toString()), token: refresh_token }),
    )
    console.log('sernd email: ', email_verify_token)
    return {
      access_token,
      refresh_token,
    }
  }
```

# Mẹo cập nhật thời gian với $curentDate và $$NOW

trong hàm `verifyEmail` của `user.service` lúc mà update_at = new Date() => đây là tạo khi đoạn code đó chạy, thì cái new date được tạo ra và gửi lên db chứ ko phải thời điểm mà mongo nó cập nhật

có 2 thời điểm => tạo giá trị cập nhật (là cái new Date) và thời điểm mongo cập nhật

nếu muốn thời điểm mongo cập nhật => dùng `$currentDate`

```ts
async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          email_verify_token: '',
          // updated_at: new Date(),
          verify: UserVerifyStatus.Verified,
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
```

cách 2 dùng `NOW`

```ts
await databaseService.users.updateOne(
  {
    _id: new ObjectId(user_id),
  },
  [
    {
      $set: {
        email_verify_token: '',
        updated_at: '$$NOW',
        verify: UserVerifyStatus.Verified,
      },
      // $currentDate: {
      //   updated_at: true,
      // },
    },
  ],
)
```

# Resend verify email

khi người dùng đăng nhập vào, chưa thấy email nào gưi đến => phải có nút gửi lại email cho tôi => phỉa có resend cho ng ta => gửi lại với cái email_veri_token mới là được

method post, ko gửi lên cái gì cả header gửi lên access_token (phải đăng nhập rồi => sang màn verify thì mới có nút resend) là ok rồi

khi check acctoken hợp lệ rồi thì check xem email đấy đã verify hay chưa đã

viết `routers`

```ts
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
```

viết `controller`

```ts
export const resendEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id),
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'User not found',
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Email already verified',
    })
  }
  const result = await userSevice.resendEmailVerify(user_id)
  return res.json(result)
}
```

viết `service`

```ts
async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    console.log('🚀 ~ UsersService ~ resendEmailVerify ~ email_verify_token:', email_verify_token)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },

        {
          $set: {
            email_verify_token,
          },
          $currentDate: {
            updated_at: true,
          },
        },
    )
    return {
      message: 'Resend email verify success',
    }
  }
```

# Quên Mật Khẩu

viết `route`

```ts
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgorPasswordController))
```

viết validator bên middleware

```ts
export const forgotPasswordValidator = validate(
  checkSchema(
    {
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
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
            })
            if (user === null) {
              throw new Error('Email not found')
            }
            req.user = user
            return true
          },
        },
      },
    },
    ['body'],
  ),
)
```

viết service

```ts
private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
      },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
      },
      privateKey: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN as string,
    })
  }
  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          forgot_password_token,
        },
        $currentDate: {
          updated_at: true,
        },
      },
    )
    // gửi email => ch làm
    console.log('forgot token : ', forgot_password_token)
    return {
      message: 'Forgot password success',
    }
  }
```

hoàn thiện `controller`

```ts
export const forgorPasswordController = async (
  req: Request<ParamsDictionary, any, ForgorPasswordReqBody>,
  res: Response,
  next: NextFunction,
) => {
  const { _id } = req.user as User
  const result = await userSevice.forgotPassword(_id.toString())
  return res.json(result)
}
```

# Verify forgot password token

`middleware`

```ts
export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: 'ForgotPasswordToken is required',
                status: HTTP_STATUS.UNAUTHORIZED,
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SERCET_FORGOT_PASSWORD_TOKEN as string,
              })
              const { user_id } = decoded_forgot_password_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }) //check trong db có ko

              if (user === null) {
                //ko thấy trong db
                throw new ErrorWithStatus({
                  message: 'User not found',
                  status: HTTP_STATUS.NOT_FOUND,
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
            } catch (error) {
              // nếu ko xử lí thế này mà để mỗi 3 dòng throw trong if thì nó luôn rơi vào case này
              // muốn bắt cả case đã sử dụng ở trên (do nếu lỗi ở trên thì nó cũng tự rơi vào catch)
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: 'ForgotPasswordToken is invalid',
                  status: HTTP_STATUS.UNAUTHORIZED,
                })
              }
              throw error
            }
          },
        },
      },
    },
    ['body'],
  ),
)
```

`routes`

```ts
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController),
)
```

`controller`

```ts
export const verifyForgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({
    message: 'Verify forgot password success',
  })
}
```
