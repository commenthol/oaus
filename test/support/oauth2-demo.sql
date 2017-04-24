-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.18 - MySQL Community Server (GPL)
-- Server OS:                    Linux
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for oauth2
CREATE DATABASE IF NOT EXISTS `oauth2` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `oauth2`;

-- Dumping structure for procedure oauth2.getAccessToken
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getAccessToken`(
	IN `accessToken` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getAccessToken(accessToken)'
BEGIN
	SELECT `accessTokens`.`id`,
	  `accessTokens`.`accessToken`,
	  `accessTokens`.`expiresAt` AS `accessTokenExpiresAt`,
	  `accessTokens`.`scope`,
	  `user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `client`.`id` AS `client.id`,
	  `client`.`clientId` AS `client.clientId`,
	  `client`.`scope` AS `client.scope`
	FROM `oauth_access_tokens` AS `accessTokens`
	LEFT OUTER JOIN `users` AS `user` ON `accessTokens`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `accessTokens`.`oauthClientId` = `client`.`id`
	WHERE `accessTokens`.`accessToken` = accessToken
	LIMIT 1;
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.getAuthorizationCode
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getAuthorizationCode`(
	IN `authorizationCode` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getAuthorizationCode(authorizationCode)'
BEGIN
	SELECT `authorizationCodes`.`id`,
	`authorizationCodes`.`authorizationCode`,
	`authorizationCodes`.`expiresAt`,
	`authorizationCodes`.`redirectUri`,
	`authorizationCodes`.`scope`,
	`user`.`id` AS `user.id`,
	`user`.`username` AS `user.username`,
	`user`.`scope` AS `user.scope`,
	`client`.`id` AS `client.id`,
	`client`.`name` AS `client.name`,
	`client`.`clientId` AS `client.clientId`,
	`client`.`scope` AS `client.scope`
	FROM `oauth_authorization_codes` AS `authorizationCodes`
	LEFT OUTER JOIN `users` AS `user` ON `authorizationCodes`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `authorizationCodes`.`oauthClientId` = `client`.`id`
	WHERE `authorizationCodes`.`authorizationCode` = authorizationCode
	LIMIT 1;
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.getClient
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getClient`(
	IN `clientId` VARCHAR(80),
	IN `clientSecret` VARCHAR(80)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getClient(clientId, [clientSecret])'
BEGIN
	SELECT clients.id, name, clientId, clientSecret, grants,
		refreshTokenLifetime, accessTokenLifetime, scope,
		clients.createdAt, clients.updatedAt, userId, redirects.redirectUri
	FROM oauth_clients AS clients
	INNER JOIN oauth_clients_redirects AS redirects ON redirects.oauthClientId = clients.id
	WHERE clients.clientId = clientId AND
		IF(ISNULL(clientSecret),ISNULL(clients.clientSecret),clients.clientSecret = clientSecret)
	LIMIT 5;
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.getRefreshToken
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getRefreshToken`(
	IN `refreshToken` VARCHAR(255)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getRefreshToken(refreshToken)'
BEGIN
	SELECT `refreshTokens`.`id`,
	  `refreshTokens`.`refreshToken`,
	  `refreshTokens`.`expiresAt` AS `refreshTokenExpiresAt`,
	  `refreshTokens`.`scope`,
		`user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `client`.`id` AS `client.id`,
	  `client`.`clientId` AS `client.clientId`,
	  `client`.`scope` AS `client.scope`
	FROM `oauth_refresh_tokens` AS `refreshTokens`
	LEFT OUTER JOIN `users` AS `user` ON `refreshTokens`.`userId` = `user`.`id`
	LEFT OUTER JOIN `oauth_clients` AS `client` ON `refreshTokens`.`oauthClientId` = `client`.`id`
	WHERE `refreshTokens`.`refreshToken` = refreshToken
	LIMIT 1;
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.getUser
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getUser`(
	IN `username` VARCHAR(254)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getUser(username)'
BEGIN
	SELECT id, username, password, scope
	FROM users
	WHERE users.username = username
	LIMIT 1;
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.getUserFromClient
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserFromClient`(
	IN `clientId` VARCHAR(80),
	IN `clientSecret` VARCHAR(80)
)
    READS SQL DATA
    DETERMINISTIC
    COMMENT 'getUserFromClient(clientId, [clientSecret])'
BEGIN
	SELECT `clients`.`id`,
	  `clients`.`clientId`,
	  `user`.`id` AS `user.id`,
	  `user`.`username` AS `user.username`,
	  `user`.`password` AS `user.password`,
	  `user`.`scope` AS `user.scope`
	FROM `oauth_clients` AS `clients` 
	LEFT OUTER JOIN `users` AS `user` ON `clients`.`userId` = `user`.`id` 
	WHERE `clients`.`clientId` = clientId  AND
		IF(ISNULL(clientSecret),ISNULL(`clients`.`clientSecret`), `clients`.`clientSecret` = clientSecret)
	LIMIT 1;
END//
DELIMITER ;

-- Dumping structure for table oauth2.oauth_access_tokens
CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `accessToken` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accessToken` (`accessToken`),
  KEY `FK1_clients_id` (`oauthClientId`),
  KEY `FK1_users_id` (`userId`),
  CONSTRAINT `FK1_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK1_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_access_tokens: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_access_tokens` ENABLE KEYS */;

-- Dumping structure for table oauth2.oauth_authorization_codes
CREATE TABLE IF NOT EXISTS `oauth_authorization_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `authorizationCode` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authorizationCode` (`authorizationCode`),
  KEY `oauthClientId` (`oauthClientId`),
  KEY `userId` (`userId`),
  CONSTRAINT `FK2_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK2_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_authorization_codes: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_authorization_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_authorization_codes` ENABLE KEYS */;

-- Dumping structure for table oauth2.oauth_clients
CREATE TABLE IF NOT EXISTS `oauth_clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientId` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientSecret` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `grants` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `refreshTokenLifetime` int(10) DEFAULT NULL,
  `accessTokenLifetime` int(10) DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK0_users_id` (`userId`),
  CONSTRAINT `FK0_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_clients: ~3 rows (approximately)
/*!40000 ALTER TABLE `oauth_clients` DISABLE KEYS */;
INSERT INTO `oauth_clients` (`id`, `name`, `clientId`, `clientSecret`, `grants`, `refreshTokenLifetime`, `accessTokenLifetime`, `scope`, `userId`, `createdAt`, `updatedAt`) VALUES
	(1, 'demoName', 'demo', 'demosecret', 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 10:58:49', '2017-04-22 10:58:52'),
	(2, 'loginName', 'login', 'loginsecret', 'password', NULL, NULL, NULL, 1, '2017-04-22 13:29:41', '2017-04-22 13:29:41'),
	(3, 'clientName', 'client', NULL, 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 14:51:52', '2017-04-22 14:51:52');
/*!40000 ALTER TABLE `oauth_clients` ENABLE KEYS */;

-- Dumping structure for table oauth2.oauth_clients_redirects
CREATE TABLE IF NOT EXISTS `oauth_clients_redirects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK4_client_id` (`oauthClientId`),
  CONSTRAINT `FK5_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_clients_redirects: ~5 rows (approximately)
/*!40000 ALTER TABLE `oauth_clients_redirects` DISABLE KEYS */;
INSERT INTO `oauth_clients_redirects` (`id`, `redirectUri`, `oauthClientId`, `createdAt`, `updatedAt`) VALUES
	(1, 'http://localhost:3000/cb', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53'),
	(2, 'http://localhost:3000/cb1', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53'),
	(3, '/', 2, '2017-04-22 13:36:40', '2017-04-22 13:36:40'),
	(4, '/cb2', 3, '2017-04-22 14:52:37', '2017-04-22 14:52:37'),
	(5, 'http://localhost:3000/cb', 1, '2017-04-22 13:26:53', '2017-04-22 13:26:53');
/*!40000 ALTER TABLE `oauth_clients_redirects` ENABLE KEYS */;

-- Dumping structure for table oauth2.oauth_refresh_tokens
CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `refreshToken` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) unsigned DEFAULT NULL,
  `userId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refreshToken` (`refreshToken`),
  KEY `FK3_clients_id` (`oauthClientId`),
  KEY `FK3_users_id` (`userId`),
  CONSTRAINT `FK3_clients_id` FOREIGN KEY (`oauthClientId`) REFERENCES `oauth_clients` (`id`),
  CONSTRAINT `FK3_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_refresh_tokens: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_refresh_tokens` ENABLE KEYS */;

-- Dumping structure for table oauth2.oauth_scopes
CREATE TABLE IF NOT EXISTS `oauth_scopes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `isDefault` bit(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_scopes: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_scopes` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_scopes` ENABLE KEYS */;

-- Dumping structure for procedure oauth2.saveAccessToken
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `saveAccessToken`(
	IN `accessToken` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT

)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveAccessToken(accessToken, expiresAt, scope, oauthClientId, userId)'
BEGIN
	INSERT INTO oauth_access_tokens (accessToken, expiresAt, scope, oauthClientId, userId)
	VALUES (accessToken, expiresAt, scope, oauthClientId, userId);
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.saveAuthorizationCode
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `saveAuthorizationCode`(
	IN `authorizationCode` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `redirectUri` VARCHAR(2000),
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT

)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveAuthorizationCode(authorizationCode, expiresAt, redirectUri, scope, oauthClientId, userId) '
BEGIN
	INSERT INTO `oauth_authorization_codes` (`authorizationCode`,`expiresAt`,`redirectUri`,`scope`,`oauthClientId`,`userId`) 
	VALUES (authorizationCode, expiresAt, redirectUri, scope, oauthClientId, userId);
END//
DELIMITER ;

-- Dumping structure for procedure oauth2.saveRefreshToken
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `saveRefreshToken`(
	IN `refreshToken` VARCHAR(255),
	IN `expiresAt` DATETIME,
	IN `scope` VARCHAR(255),
	IN `oauthClientId` BIGINT,
	IN `userId` BIGINT

)
    MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'saveRefreshToken(refreshToken, expiresAt, scope, oauthClientId, userId)'
BEGIN
	INSERT INTO oauth_refresh_tokens (refreshToken, expiresAt, scope, oauthClientId, userId)
	VALUES (refreshToken, expiresAt, scope, oauthClientId, userId);
END//
DELIMITER ;

-- Dumping structure for table oauth2.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(254) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.users: ~2 rows (approximately)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `username`, `password`, `scope`, `createdAt`, `updatedAt`) VALUES
	(1, 'admin@admin', 'admin', NULL, '2017-04-22 13:12:03', '2017-04-22 13:12:03'),
	(2, 'user@user', 'user', NULL, '2017-04-22 13:37:53', '2017-04-22 13:37:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
