module.exports = {
  env: {
    node: true
  },
  extends: [
    'standard'
  ],
  rules: {
    camelcase: 'off',
    'no-console': 'warn',
    'spaced-comment': [
      'error',
      'always',
      {
        markers: [
          '>'
        ]
      }
    ]
  }
}
