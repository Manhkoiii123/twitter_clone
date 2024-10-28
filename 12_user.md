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
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyValidator))
```

viết `controller`

```ts
export const emailVerifyValidator = async (req: Request, res: Response, next: NextFunction) => {
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
