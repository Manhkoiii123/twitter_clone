import express from 'express'
import { defaultErrorHandler } from '~/middlewares/errorMiddleware'
import mediasRoute from '~/routes/medias.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.service'
const app = express()
const port = 3000
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
app.use('/medias', mediasRoute)
databaseService.connect()
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
