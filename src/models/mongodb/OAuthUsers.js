const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthUserSchema = new Schema({
  username: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true},
  scope: String
})

module.exports = mongoose.model('OAuthUsers', OAuthUserSchema)
