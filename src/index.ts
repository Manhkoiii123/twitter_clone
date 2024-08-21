import express from 'express'
import usersRouter from '~/routes/users.routes'
const app = express()
const port = 3000
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
