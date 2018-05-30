const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthClientsSchema = new Schema({
  name: String,
  clientId: {type: String, required: true, index: {unique: true}},
  secret: {type: String, required: true},
  redirectUris: {type: Array, required: true},
  grants: {type: Array, required: true},
  refreshTokenLifetime: {type: Number},
  accessTokenLifetime: {type: Number},
  scope: {type: String},
  logoutURI: {type: String},
  createdAt: {type: Date},
  updatedAt: {type: Date},
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthUsers'
  }
})

module.exports = mongoose.model('OAuthClients', OAuthClientsSchema)
