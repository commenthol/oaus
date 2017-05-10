const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthClientsSchema = new Schema({
  name: String,
  clientId: {type: String, required: true, index: {unique: true}},
  clientSecret: {type: String, required: true},
  redirectUris: {type: Array, required: true},
  grants: {type: Array, required: true},
  refreshTokenLifetime: Number,
  accessTokenLifetime: Number,
  scope: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthUsers'
  }
})

module.exports = mongoose.model('OAuthClients', OAuthClientsSchema)
