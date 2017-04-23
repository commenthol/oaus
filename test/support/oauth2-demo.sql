-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping database structure for oauth2
CREATE DATABASE IF NOT EXISTS `oauth2` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `oauth2`;


-- Dumping structure for table oauth2.oauth_access_tokens
CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `accessToken` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
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
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `authorizationCode` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
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
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientId` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `clientSecret` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `redirectUri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `grants` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `refreshTokenLifetime` int(10) DEFAULT NULL,
  `accessTokenLifetime` int(10) DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK0_users_id` (`userId`),
  CONSTRAINT `FK0_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_clients: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_clients` DISABLE KEYS */;
INSERT INTO `oauth_clients` (`id`, `name`, `clientId`, `clientSecret`, `redirectUri`, `grants`, `refreshTokenLifetime`, `accessTokenLifetime`, `scope`, `userId`, `createdAt`, `updatedAt`) VALUES
	(1, 'demo', 'democlient', 'democlientsecret', 'http://localhost:3000/cb', 'authorization_code,password,refresh_token,client_credentials', NULL, NULL, NULL, 1, '2017-04-22 10:58:49', '2017-04-22 10:58:52');
/*!40000 ALTER TABLE `oauth_clients` ENABLE KEYS */;


-- Dumping structure for table oauth2.oauth_refresh_tokens
CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `refreshToken` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oauthClientId` bigint(20) DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `isDefault` bit(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.oauth_scopes: ~0 rows (approximately)
/*!40000 ALTER TABLE `oauth_scopes` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_scopes` ENABLE KEYS */;


-- Dumping structure for table oauth2.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(254) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table oauth2.users: ~0 rows (approximately)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `username`, `password`, `scope`) VALUES
	(1, 'admin', 'admin', NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
