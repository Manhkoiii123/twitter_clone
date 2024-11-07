import { ObjectId, WithId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'

class TweetService {
  async checkAndCreateHashTag(hashTags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashTags.map((hashTag) => {
        //tìm nếu ch có thì thêm
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashTag,
          },
          {
            $setOnInsert: new Hashtag({
              name: hashTag,
            }),
          },
          {
            upsert: true,
            returnDocument: 'after',
          },
        )
      }),
    )
    return hashtagDocuments.map((hashTag) => (hashTag as WithId<Hashtag>)._id)
  }
  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashTag(body.hashtags)
    console.log('🚀 ~ TweetService ~ createTweet ~ hashtags:', hashtags)
    const res = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtags, // chưa xử lí
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
