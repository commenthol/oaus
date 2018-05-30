const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthUserSchema = new Schema({
  username: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true},
  scope: {type: String},
  remember: {type: Boolean},
  logoutToken: {type: String},
  lastSignInAt: {type: Date},
  lastSignOutAt: {type: Date},
  createdAt: {type: Date},
  updatedAt: {type: Date}
})

module.exports = mongoose.model('OAuthUsers', OAuthUserSchema)
