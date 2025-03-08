import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { TokenPayload } from '~/models/requests/User.request'
import tweetService from '~/services/tweets.services'
export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  return res.status(201).json({
    message: 'Create tweet success',
    result,
  })
}
export const getTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  return res.status(201).json({
    message: 'get tweet success',
    result: 'ok',
  })
}
