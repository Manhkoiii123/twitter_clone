import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Orther'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: string | null
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}
