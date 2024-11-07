# thiết kế schema cho table tweet

khi tạo tweet thì phải có các thông tin sau:

```ts
interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: string | null // null nếu là cha, còn nếu ko thì là tweet_id cha dạng string
  hashtags: string[] // do user gửi lên thì gửi lên string (name của hashtags ví dụ #js #react => khi lên api thì tạo hashtag collection)
  mentions: string[] // tương tự cái hashtags lên (string này là string dạng user_id)
  medias: Media[]
  // guest_views: number // ko để ng dùng gửi lên được
  // user_views: number // ko để ng dùng gửi lên được
}
// interface TweetRequestBody {
//   type: TweetType
//   audience: TweetAudience
//   content: string
//   parent_id: string | null
//   hashtags: string[] thì tạo hashtag collection)
//   mentions: string[]
//   medias: Media[]
// }
```

khi upload media thì phải có các thông tin sau => upload media => trả ra 1 cái arr media rồi add vào tweet => gửi lên

khi mentions => thực hiện 1 cái api là `getUserIdByUsername` để lấy cái `user` => đưa nó vào mentions

khi fe `@` 1 ai đó thì call 1 cái api `getUserIdByUsername` để lấy cái `user` => đưa nó vào mentions => dùng api `/users/:username` khi @ + onchange => call api này để lấy ra id của người đó hoặc là call 1 cái api tìm kiếm (học sau) => search theo username (cái nhập vào sau @) => api này trả ra 1 cái arr user_id => đưa nó vào mentions

code tạo schema: file `/src/models/schemas/Tweet.schema.ts`

```ts
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Orther'

interface TweetConstructor {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at?: Date
  updated_at?: Date
}
export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    audience,
    content,
    guest_views,
    hashtags,
    medias,
    mentions,
    parent_id,
    type,
    user_id,
    user_views,
    created_at,
    updated_at,
  }: TweetConstructor) {
    const date = new Date()
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.type = type
    this.audience = audience
    this.content = content
    this.parent_id = parent_id
    this.hashtags = hashtags
    this.mentions = mentions
    this.medias = medias
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
```

# validate tweet body

nếu mà để validate 100% case của tweet thì tốn thời gian => validate case chính

- `type` là 1 trong 4 cái `tweet`, `comment`, `retweet`, `quote` (enum)

- `audience` là 1 trong 2 cái enum

- nếu `type` là `comment`, `retweet`, `quote` thì phải có `parent_id` phải là `tweet_id` của tweet cha, còn lại là `tweet` thì ko cần `parent_id` (null)

- nếu `type` là retweet thì `content` để trống. Nếu là comment, quote và tweet mà ko có `mentions` và `hashtags` thì `content` phải là string ko được rỗng
- `medias` là mảng các media
- `mentions` là mảng các string dạng id
- `hashtags` là mảng các string
