// alert messages
module.exports = {
  bad_csrf_token:
    {strong: 'The CSRF token is invalid!', text: 'Please try to resubmit the form'},
  invalid_grant:
    {strong: 'Oops snap!', text: 'Wrong Email address or Password. Please resubmit.'},
  session_expired:
    {strong: 'Oops sorry', text: 'Your session has expired, please sign-in again.'},
  server_error:
    {strong: 'Oops sorry', text: 'Something went wrong.. Please try again.'}
}
