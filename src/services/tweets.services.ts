import { ObjectId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'

class TweetService {
  async createTweet(body: TweetRequestBody, user_id: string) {
    const res = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [], // chưa xử lí
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id),
      }),
    )
    // muốn trả về cái vừa tạo phải find nó nhưng thường thì ko
    // const tmp = await databaseService.tweets.findOne({ _id: res.insertedId })

    return res
  }
}
const tweetService = new TweetService()
export default tweetService
