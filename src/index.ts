import express, { NextFunction, Request, Response } from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.service'
const app = express()
const port = 3000
app.use(express.json()) // là 1 cái middleware cái ex.json sẽ đưa cái json truyền lên ở body thành 1 cái obj
app.use('/users', usersRouter)
databaseService.connect()
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ error: err.message })
})
app.listen(port, () => {
  console.log(`app is running in port ${port}`)
})
