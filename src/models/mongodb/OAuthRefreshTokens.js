const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthRefreshTokenSchema = new Schema({
  refreshToken: {type: String, required: true},
  expiresAt: {type: Date, index: { expireAfterSeconds: 0 }},
  scope: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  oauthClientId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthClients'
  }
})

module.exports = mongoose.model('OAuthRefreshTokens', OAuthRefreshTokenSchema)
