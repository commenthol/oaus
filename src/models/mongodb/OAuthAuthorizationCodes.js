const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthAuthorizationCodeSchema = new Schema({
  authorizationCode: {type: String, required: true, unique: true},
  expiresAt: {type: Date, index: { expireAfterSeconds: 0 }},
  redirectUri: {type: String, required: true},
  scope: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthUsers'
  },
  oauthClientId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthClients'
  }
})

module.exports = mongoose.model('OAuthAuthorizationCodes', OAuthAuthorizationCodeSchema)
