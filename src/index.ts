import { config } from 'dotenv'
import express from 'express'
import path from 'path'
import { defaultErrorHandler } from '~/middlewares/errorMiddleware'
import mediasRoute from '~/routes/medias.routes'
import staticRoute from '~/routes/static.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initFolder } from '~/utils/file'
const app = express()

config()
const port = process.env.PORT || 3000
// taọ folder upload
initFolder()
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
app.use('/medias', mediasRoute)
// app.use(`/medias`, express.static(path.resolve('uploads')))
app.use('/static', staticRoute)
databaseService.connect()
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
