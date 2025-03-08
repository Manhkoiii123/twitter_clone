import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { wrapRequestHandler } from '~/utils/handlers'
import { numberEnumToArray } from '~/utils/orther'
import { validate } from '~/utils/validation'

// cái TweetType khi log ra nó là 1 cái object => cần chuyển nó sang arr
const tweetType = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)
// console.log('🚀 ~ tweetType:', tweetType) => 🚀 ~ tweetType: [ 0, 1, 2, 3 ]
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetType], // 4 cái trong enum
        errorMessage: 'Invalid tweet type',
      },
    },
    audience: {
      isIn: {
        options: [tweetAudience], // 4 cái trong enum
        errorMessage: 'Invalid tweet audience',
      },
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error('Invalid parent id')
          }
          if (type === TweetType.Tweet && value !== null) {
            throw new Error('Parent id must be null')
          }
          return true
        },
      },
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error('Content is required')
          }
          if (type === TweetType.Retweet && value !== '') {
            throw new Error('Content must be empty string')
          }
          return true
        },
      },
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // yêu cầu các phần tử trong array là string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error('Invalid hashtags')
          }
          return true
        },
      },
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // yêu cầu các phần tử trong array là userid
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error('Mentions must be valid user ids')
          }
          return true
        },
      },
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // yêu cầu các phần tử trong array là Media Object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaType.includes(item.type as any)
            })
          ) {
            throw new Error('Media must be invalid')
          }
          return true
        },
      },
    },
  }),
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: 'Invalid tweet id',
        },
        custom: {
          options: async (value, { req }) => {
            const tweet = await databaseService.tweets.findOne({
              _id: new ObjectId(value),
            })
            if (!tweet) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: 'Tweet not found',
              })
            }
            ;(req as Request).tweet = tweet
            return true
          },
        },
      },
    },
    ['params', 'body'],
  ),
)
//  muốn dùng async await thì phải có try catch || wrapRequestHandler
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  // cần cái tweet => để lấy ra được cái tw.audience => trong cái twIdValidator đã có cái findOne rồi => gán nó vào cái req => ko cần query lại nữa
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // kiểm tra ng xem tweet này đã đăng nhập hay chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: 'You are not logged in',
      })
    }
    // kiểm tra tài khoản tác giả có ổn (bị khóa hay bị xóa chưa)
    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id),
    })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: "User doesn't exist",
      })
    }
    // kiểm tra xem ng xem tweet này có trong tweet circle của tác giả hay ko
    const { user_id } = req.decoded_authorization
    const isInCircle = author.twitter_circle.some((i) => i.equals(user_id))
    if (!isInCircle && !author._id.equals(user_id)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: 'You are not in the circle',
      })
    }
  }
  next()
})
