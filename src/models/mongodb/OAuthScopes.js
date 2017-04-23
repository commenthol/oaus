const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OAuthScopeSchema = new Schema({
  scope: {type: String, required: true},
  isDefault: Boolean
})

module.exports = mongoose.model('OAuthScopes', OAuthScopeSchema)
