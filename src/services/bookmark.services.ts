import { ObjectId } from 'mongodb'
import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from '~/services/database.services'

class BookmarkService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const res = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id),
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id),
        }),
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )
    return res
  }
  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const res = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id),
    })
    return res
  }
}
const bookmarkService = new BookmarkService()
export default bookmarkService
