# Upload file bằng formidable

formidable dùng được cho mọi thư viện be node, fastify

# Xử lý tham số truyền từ command

lúc trả về => trả về là `http://localhost:3000/uploads/${newPath}.jpg` thì chỉ chạy được với local thôi

lúc deploy caafn đổi cái url => làm sao để biết đưcọ là môi trường dev hay môi trường build

lúc dev là chạy npm run dev

lúc trên server thì phải build => start

=> cần truyền tham số vào cái `script` của `package.json`

trong file đó cái `script` => `dev` => sửa thành `npx nodemon --hello`

trên file `index.ts` => có thể chạy thử `console.log(process.argv)` => lúc này chạy `npm run dev` => chạy thì nó vẫn ok

tương tự bên cái `start`

sửa trong file `package.json`

```ts
"scripts": {
    "dev": "npx nodemon --development",
    "build": "rimraf ./dist && tsc && tsc-alias",
    "start": "node dist/index.js --production",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "prettier": "prettier --check .",
    "prettier:fix": "prettier --write ."
  },
```

khi đó `npm run dev` => lúc mà cl ra cái `console.log(process.argv)` thì nó ra 1 mảng, số thứ 3 của mảng đó là cái `development` => biết được là môi trường nào

khi `npm run build` => `npm start` => số thứ 3 sẽ là `production`

=> cài đặt cái thư viện `minimist`

bên `index.ts`

```ts
import { config } from 'dotenv'
import express from 'express'
import { defaultErrorHandler } from '~/middlewares/errorMiddleware'
import mediasRoute from '~/routes/medias.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'
const app = express()
// true
config()
const port = process.env.PORT || 3000
// taọ folder uplaod
initFolder()
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
app.use('/medias', mediasRoute)
databaseService.connect()
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
```

=> tách nó sang file `utils/config.ts`

```ts
import argv from 'minimist'
const option = argv(process.argv.slice(2))
export const isProduction = Boolean(option.production)
export const isDevelopment = option.development
```

khi đó sử dụng bên cái `mediaServices`

```ts
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    // chuyển cái file thành test.jpg trong thư mục uploads
    const newPath = getNameFromFullname(file.newFilename)
    const newDir = path.resolve('uploads/', `${newPath}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newDir)
    // xóa file tmp
    fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/medias/${newPath}.jpg`
      : `http://localhost:${process.env.PORT}/medias/${newPath}.jpg`
  }
}
```

# Serving static file

trả về link ảnh rồi, mà ấn vào thì nó ch ra link ảnh => làm sao để ấn ra link ảnh

khi link anhr trả về dạng `http://localhost:3000/medias/4176a8179c05b0a84a6c84900.jpg`

thì thêm dòng này vào file `index.ts`

```ts
app.use(`/medias`, express.static(path.resolve('uploads')))
```

khi đó ấn vào ảnh là ra ảnh đó luôn

## cách khác xử lí Serving static file (thường làm hơn)

tạo `/routes/static.routes.ts`,`controllers/static.controllers.ts` => đọc code là ok
