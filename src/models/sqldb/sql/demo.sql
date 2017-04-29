INSERT INTO `users` (`id`, `username`, `password`, `scope`, `createdAt`, `updatedAt`) VALUES
  (1, 'admin@admin', 'admin', NULL, '2017-04-22 13:12:03', '2017-04-22 13:12:03'),
  (2, 'user@user', 'user', NULL, '2017-04-22 13:37:53', '2017-04-22 13:37:54');

INSERT INTO `oauth_clients_redirects` (`id`, `redirectUri`, `oauthClientId`, `createdAt`, `updatedAt`) VALUES
  (1, 'http://localhost:3000/cb', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53'),
  (2, 'http://localhost:3000/cb1', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53'),
  (3, '/', 2, '2017-04-22 13:36:40', '2017-04-22 13:36:40'),
  (4, '/cb2', 3, '2017-04-22 14:52:37', '2017-04-22 14:52:37'),
  (5, 'http://localhost:3000/cb', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53');

INSERT INTO `oauth_clients` (`id`, `name`, `clientId`, `clientSecret`, `grants`, `refreshTokenLifetime`, `accessTokenLifetime`, `scope`, `userId`, `createdAt`, `updatedAt`) VALUES
	(1, 'demoName', 'demo', 'demosecret', 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 10:58:49', '2017-04-22 10:58:52'),
	(2, 'loginName', 'login', 'loginsecret', 'password', NULL, NULL, NULL, 1, '2017-04-22 13:29:41', '2017-04-22 13:29:41'),
	(3, 'clientName', 'client', NULL, 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 14:51:52', '2017-04-22 14:51:52');
