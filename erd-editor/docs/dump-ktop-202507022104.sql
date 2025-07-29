-- MySQL dump 10.13  Distrib 8.0.32, for Win64 (x86_64)
--
-- Host: localhost    Database: ktop
-- ------------------------------------------------------
-- Server version	8.0.32

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ad_banner`
--

DROP TABLE IF EXISTS `ad_banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_banner` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '광고 고유 id',
  `position` enum('main','middle','bottom','popup') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '광고 위치',
  `title` varchar(255) DEFAULT NULL COMMENT '광고 제목',
  `media_type` enum('image','video') NOT NULL COMMENT '광고 타입 ex) 이미지 / 영상',
  `link_url` varchar(500) DEFAULT NULL COMMENT '광고 이동 url',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '광고 표출 여부',
  `start_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '노출 시작일',
  `end_at` timestamp NULL DEFAULT NULL COMMENT '노출 종료일',
  `file_id` int DEFAULT NULL COMMENT '파일 ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '광고 생성일',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '광고 수정일',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_banner`
--

LOCK TABLES `ad_banner` WRITE;
/*!40000 ALTER TABLE `ad_banner` DISABLE KEYS */;
INSERT INTO `ad_banner` VALUES (2,'popup','ㅁㅁㅁㅁ','image','http://localhost:8080/ktop/admin/site/ad/write?position=main',1,'2025-06-28 15:00:00','2025-06-29 15:00:00',55,'2025-06-28 14:43:25','2025-06-28 14:43:25'),(3,'main','ㅇㅇㅇㅇ','image','https://www.naver.com',1,'2025-06-28 15:00:00','2025-06-29 15:00:00',56,'2025-06-28 15:21:47','2025-06-29 02:05:46'),(4,'middle','aass','image','https://www.naver.com/',1,'2025-06-26 15:00:00','2025-06-27 15:00:00',57,'2025-06-28 15:22:27','2025-06-28 15:51:48'),(5,'bottom','sss','image','https://www.naver.com/',1,'2025-06-27 15:00:00','2025-06-28 15:00:00',59,'2025-06-28 15:23:14','2025-06-28 15:25:19');
/*!40000 ALTER TABLE `ad_banner` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_comment`
--

DROP TABLE IF EXISTS `board_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_comment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '댓글 고유 ID',
  `post_id` bigint NOT NULL COMMENT '댓글이 속한 게시글 ID',
  `user_id` varchar(255) NOT NULL COMMENT '작성자 회원 ID',
  `content` text NOT NULL COMMENT '댓글 내용',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '댓글 등록일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '댓글 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '댓글 삭제일',
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `board_comment_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `board_post` (`id`),
  CONSTRAINT `board_comment_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 댓글 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_comment`
--

LOCK TABLES `board_comment` WRITE;
/*!40000 ALTER TABLE `board_comment` DISABLE KEYS */;
INSERT INTO `board_comment` VALUES (1,1,'aaaaaaa','ㅁㅁ','2025-06-09 11:49:25','2025-06-09 12:03:33','2025-06-09 12:03:33'),(2,1,'aaaaaaa','ㅁㄴㅇ','2025-06-09 11:49:41','2025-06-09 12:03:35','2025-06-09 12:03:35'),(3,1,'aaaaaaa','ㅁ','2025-06-09 11:50:58',NULL,NULL),(4,1,'aaaaaaa','ㅁ','2025-06-09 11:52:47',NULL,NULL),(5,1,'aaaaaaa','ㅁ','2025-06-09 11:53:10',NULL,NULL),(6,1,'aaaaaaa','ㄴ','2025-06-09 11:53:48',NULL,NULL),(7,1,'aaaaaaa','ㄴ','2025-06-09 11:54:36',NULL,NULL),(8,1,'aaaaaaa','ㅁ','2025-06-09 11:54:38',NULL,NULL),(9,1,'aaaaaaa','ㅁㅁ','2025-06-09 12:03:37','2025-06-09 12:03:38','2025-06-09 12:03:38'),(10,1,'aaaaaaa','ㅓ','2025-06-09 12:04:01','2025-06-09 12:05:29','2025-06-09 12:05:29'),(11,1,'aaaaaaa','ㅁㅁ','2025-06-09 12:05:31','2025-06-09 12:05:33','2025-06-09 12:05:33');
/*!40000 ALTER TABLE `board_comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_post`
--

DROP TABLE IF EXISTS `board_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_post` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '게시글 고유 id',
  `board_type` int NOT NULL COMMENT '게시글 종류 ex) 1 : 공지 2 : qna',
  `user_id` varchar(255) NOT NULL COMMENT '회원 아이디',
  `title` varchar(255) NOT NULL COMMENT '게시글 제목',
  `content` text COMMENT '게시글 본문',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '게시글 등록일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '게시글 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '게시글 삭제일',
  `expire_date` timestamp NULL DEFAULT NULL COMMENT '공지 만료일',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `board_post_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_post`
--

LOCK TABLES `board_post` WRITE;
/*!40000 ALTER TABLE `board_post` DISABLE KEYS */;
INSERT INTO `board_post` VALUES (1,2,'aaaaaaa','ㅁㅁㅁ','<p>ㅁㄴㅇ</p>','2025-06-07 13:48:06','2025-06-08 08:43:30',NULL,'2025-05-31 15:00:00'),(2,1,'aaaaaaa','ㅁㄴㅇ','<p>ㅁㄴㅇㅁㄴㅇ</p>','2025-06-07 13:48:24',NULL,NULL,'2025-06-20 15:00:00'),(3,1,'aaaaaaa','ㅁㄴㅇ','<p>ㅁㄴㅇㅁㄴㅇ</p>','2025-06-07 13:49:47',NULL,NULL,'2025-06-20 15:00:00'),(4,1,'aaaaaaa','ㅁ','<p>ㄴㄴㄴ</p>','2025-06-07 13:51:15',NULL,NULL,'2025-06-12 15:00:00'),(5,1,'aaaaaaa','ㅁㅁㅁㅁ','<p>ㄴㄴㄴㄴㄴㄴ</p>','2025-06-07 13:52:27','2025-06-08 07:54:45',NULL,'2025-06-12 15:00:00'),(6,1,'aaaaaaa','ㅁㅁ','<p>ㅁㅁ</p>','2025-06-08 08:20:29','2025-06-08 08:24:26','2025-06-08 08:24:26','2025-06-19 15:00:00'),(7,1,'aaaaaaa','ㅁㄴㅇ','<p>ㅁㅁㅁ</p>','2025-06-08 08:26:07','2025-06-08 08:26:29','2025-06-08 08:26:29','2025-06-13 15:00:00'),(8,2,'aaaaaaa','ㅁㅁㅁ','<p>ㅁㄴㅇ<img style=\"\" alt=\"editor_image\" src=\"/ktop/uploads/4325f02e-665d-4486-bd9e-95af7959afd0_40535_40479_5553.jpg\"></p>','2025-06-08 08:46:29','2025-06-08 08:49:56','2025-06-08 08:49:56',NULL);
/*!40000 ALTER TABLE `board_post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_post_file`
--

DROP TABLE IF EXISTS `board_post_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_post_file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '게시글 파일 고유 id',
  `post_id` bigint NOT NULL COMMENT '게시글 고유 id',
  `file_id` bigint NOT NULL COMMENT '파일 고유 id',
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `board_post_file_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `board_post` (`id`),
  CONSTRAINT `board_post_file_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `file` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 파일 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_post_file`
--

LOCK TABLES `board_post_file` WRITE;
/*!40000 ALTER TABLE `board_post_file` DISABLE KEYS */;
INSERT INTO `board_post_file` VALUES (3,5,41),(5,5,43);
/*!40000 ALTER TABLE `board_post_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_post_view`
--

DROP TABLE IF EXISTS `board_post_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_post_view` (
  `post_id` bigint NOT NULL COMMENT '게시글 고유 id',
  `user_id` varchar(255) NOT NULL COMMENT '조회한 사용자 id',
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '조회 시각',
  PRIMARY KEY (`post_id`,`user_id`),
  KEY `bpv_user_fk` (`user_id`),
  CONSTRAINT `bpv_post_fk` FOREIGN KEY (`post_id`) REFERENCES `board_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bpv_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='조회수 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_post_view`
--

LOCK TABLES `board_post_view` WRITE;
/*!40000 ALTER TABLE `board_post_view` DISABLE KEYS */;
INSERT INTO `board_post_view` VALUES (1,'aaaaaaa','2025-06-08 08:43:33'),(2,'aaaaaaa','2025-06-07 15:08:11'),(3,'aaaaaaa','2025-06-07 15:08:10'),(4,'aaaaaaa','2025-06-07 15:08:07'),(5,'aaaaaaa','2025-06-07 14:57:16'),(6,'aaaaaaa','2025-06-08 08:21:55'),(7,'aaaaaaa','2025-06-08 08:26:07'),(8,'aaaaaaa','2025-06-08 08:46:29');
/*!40000 ALTER TABLE `board_post_view` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_view_log`
--

DROP TABLE IF EXISTS `board_view_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_view_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '조회 기록 고유 ID',
  `post_id` bigint NOT NULL COMMENT '조회한 게시글 ID',
  `user_id` varchar(255) DEFAULT NULL COMMENT '조회자 회원 ID (비회원 NULL)',
  `ip_address` varchar(45) DEFAULT NULL COMMENT '접속 IP (비회원 식별용)',
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '조회 일시',
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `board_view_log_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `board_post` (`id`),
  CONSTRAINT `board_view_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 조회 기록 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_view_log`
--

LOCK TABLES `board_view_log` WRITE;
/*!40000 ALTER TABLE `board_view_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `board_view_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '카테고리 고유 id',
  `name` varchar(100) NOT NULL COMMENT '카테고리 이름 ex) 건축, 토목, 조경',
  `parent_id` bigint DEFAULT NULL COMMENT '부모카테고리 아이디',
  `depth` int DEFAULT '0' COMMENT '계층 수준 0 : 대분류, 1 : 중분류',
  `display_order` int DEFAULT '0' COMMENT '정렬 순서',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '카테고리 사용 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '카테고리 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '카테고리 수정일',
  PRIMARY KEY (`id`),
  KEY `fk_category_parent` (`parent_id`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='카테고리 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (35,'건축',NULL,0,0,1,'2025-05-25 13:42:52','2025-06-04 12:46:42'),(37,'건축하위1',35,0,0,1,'2025-05-25 13:44:20','2025-06-04 12:46:43'),(38,'토목',NULL,0,0,1,'2025-05-26 10:51:55','2025-06-04 12:46:43'),(39,'건설',NULL,0,0,1,'2025-05-26 11:20:01','2025-06-04 12:46:45'),(41,'건설하위2',39,0,0,1,'2025-05-26 11:33:44','2025-06-04 12:46:46'),(42,'건설하위3',39,0,0,1,'2025-05-26 11:33:47','2025-06-04 12:46:46'),(44,'토목하위1',38,0,0,1,'2025-05-26 11:34:33','2025-06-04 12:46:44'),(45,'토목하위2',38,0,0,1,'2025-05-26 11:34:35','2025-06-04 12:46:44'),(46,'토목하위3',38,0,0,1,'2025-05-26 11:34:36','2025-06-04 12:46:45');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `id` varchar(255) NOT NULL COMMENT '업체 아이디',
  `company_name` varchar(100) NOT NULL COMMENT '업체명',
  `ceo_name` varchar(50) NOT NULL COMMENT '대표자명',
  `phone` varchar(20) DEFAULT NULL COMMENT '업체 전화번호',
  `email` varchar(100) DEFAULT NULL COMMENT '업체 이메일',
  `zipcode` varchar(10) DEFAULT NULL COMMENT '업체 우편주소',
  `address1` varchar(255) DEFAULT NULL COMMENT '업체 주소',
  `address2` varchar(255) DEFAULT NULL COMMENT '업체 상세주소',
  `homepage` varchar(255) DEFAULT NULL COMMENT '업체 홈페이지 주소',
  `region_id` bigint DEFAULT NULL COMMENT '업체 지역 코드',
  `description_html` text COMMENT '업체 소개 문구',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '업체 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '업체 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '업체 탈퇴일',
  PRIMARY KEY (`id`),
  KEY `region_id` (`region_id`),
  CONSTRAINT `company_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`),
  CONSTRAINT `company_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `region_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업체 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES ('aaaaaaa','aaaa','ㅇㅇ','010-1111-1111','a@a.com','63534','제주특별자치도 서귀포시 가가로 14 (상예동)','ㅁㅁㅁㅁ','ㅁㅁ',8,'<p><img style=\"\" alt=\"editor_image\" src=\"/ktop/uploads/e1159850-4011-4a47-93af-7339b0a3128b_2023-10-31 18 36 41.png\"><img style=\"\" alt=\"editor_image\" src=\"/ktop/uploads/3d2005aa-75c7-4dbc-95c5-57c95ebccfac_2023-07-18 00 23 51.png\">ㄴㄴㄴㄴㄴ<img style=\"\" alt=\"editor_image\" src=\"/ktop/uploads/f9f7bbda-c813-48a7-94ba-446e950b194d_2024-01-01 06 21 07.png\"><br></p>','2025-05-30 12:56:20','2025-06-22 08:24:28',NULL);
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_file`
--

DROP TABLE IF EXISTS `company_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '업체 파일 고유 id',
  `company_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '업체아이디',
  `file_id` bigint NOT NULL COMMENT '파일 고유 id',
  `file_type` int NOT NULL COMMENT '첨부파일 타입 ex) 1 : 사업자등록증, 2 : 소개 이미지',
  PRIMARY KEY (`id`),
  KEY `compnay_id` (`company_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `company_file_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`),
  CONSTRAINT `company_file_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `file` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업체 파일 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_file`
--

LOCK TABLES `company_file` WRITE;
/*!40000 ALTER TABLE `company_file` DISABLE KEYS */;
INSERT INTO `company_file` VALUES (1,'aaaaaaa',20,1),(2,'aaaaaaa',21,2);
/*!40000 ALTER TABLE `company_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faq_post`
--

DROP TABLE IF EXISTS `faq_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faq_post` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'faq 고유 id',
  `user_id` varchar(255) DEFAULT NULL COMMENT '회원 아이디',
  `title` varchar(255) NOT NULL COMMENT 'faq 제목',
  `answer` text NOT NULL COMMENT 'faq 답변',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'faq 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'faq 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'faq 삭제일',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `faq_post_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='faq 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faq_post`
--

LOCK TABLES `faq_post` WRITE;
/*!40000 ALTER TABLE `faq_post` DISABLE KEYS */;
INSERT INTO `faq_post` VALUES (1,'aaaaaaa','ㅇ?','<p>ㅇㅇ</p>','2025-06-08 09:06:06','2025-06-15 04:40:59',NULL),(2,'aaaaaaa','ㅁㄴㅇ','<p>ㅁㄴㅇ</p>','2025-06-08 09:13:58','2025-06-08 09:23:00','2025-06-08 09:23:00'),(3,'aaaaaaa','가입방법','<p><img alt=\"editor_image\" src=\"/ktop/uploads/f2eb9eae-d4bc-4cce-aa3f-d057d25fbed8_카테고리 (3).png\" style=\"\"><br></p>','2025-06-09 08:59:48',NULL,NULL);
/*!40000 ALTER TABLE `faq_post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '파일 고유 id',
  `file_path` varchar(255) NOT NULL COMMENT '파일 업로드 경로',
  `original_name` varchar(255) DEFAULT NULL COMMENT '파일 원본명',
  `file_name` varchar(255) DEFAULT NULL COMMENT '파일 업로드명',
  `mime_type` varchar(100) DEFAULT NULL COMMENT '파일 타입 ex) image, binary, video',
  `file_size` int DEFAULT NULL COMMENT '파일 사이즈',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '파일 업로드일',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='파일 공통테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file`
--

LOCK TABLES `file` WRITE;
/*!40000 ALTER TABLE `file` DISABLE KEYS */;
INSERT INTO `file` VALUES (1,'/uploads/5ed1efd5-f104-423c-afbd-2f5388f7db75_카테고리.png','카테고리.png','5ed1efd5-f104-423c-afbd-2f5388f7db75_카테고리.png','image/png',31852,'2025-05-29 13:01:37'),(2,'/uploads/4d48e6ac-499f-482f-a22c-b3dc665a149a_2023-07-18 00 23 51.png','2023-07-18 00 23 51.png','4d48e6ac-499f-482f-a22c-b3dc665a149a_2023-07-18 00 23 51.png','image/png',7273,'2025-05-29 13:01:37'),(3,'/uploads/cdb103a4-6cf0-4855-8937-034d3705db24_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','cdb103a4-6cf0-4855-8937-034d3705db24_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:35:44'),(4,'/uploads/8438410d-b338-4a01-a9be-2253e8c785a0_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','8438410d-b338-4a01-a9be-2253e8c785a0_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:37:24'),(5,'/uploads/1d8e792e-75c1-4030-a70d-7d9cae36af5a_8438410d-b338-4a01-a9be-2253e8c785a0_2024-01-01 06 21 07.png','8438410d-b338-4a01-a9be-2253e8c785a0_2024-01-01 06 21 07.png','1d8e792e-75c1-4030-a70d-7d9cae36af5a_8438410d-b338-4a01-a9be-2253e8c785a0_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:37:38'),(6,'/uploads/ec863399-8541-4d98-bdd1-5f8b7ad0b55f_2023-07-18 00 23 51.png','2023-07-18 00 23 51.png','ec863399-8541-4d98-bdd1-5f8b7ad0b55f_2023-07-18 00 23 51.png','image/png',7273,'2025-05-30 12:37:47'),(7,'/uploads/fcd1c492-e552-46a7-a5b4-d42bcc6db858_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','fcd1c492-e552-46a7-a5b4-d42bcc6db858_2023-10-31 18 36 41.png','image/png',6068,'2025-05-30 12:37:47'),(8,'/uploads/d3b7d06d-6cb1-467f-91e1-edef6ff6e01c_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','d3b7d06d-6cb1-467f-91e1-edef6ff6e01c_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:37:47'),(9,'/uploads/16eed1bd-f237-4239-8335-0ce0a8da4366_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','16eed1bd-f237-4239-8335-0ce0a8da4366_2023-10-31 18 36 41.png','image/png',6068,'2025-05-30 12:39:11'),(10,'/uploads/352505b9-a245-48f4-94fd-b27deabc3f70_2023-07-18 00 23 51.png','2023-07-18 00 23 51.png','352505b9-a245-48f4-94fd-b27deabc3f70_2023-07-18 00 23 51.png','image/png',7273,'2025-05-30 12:39:11'),(11,'/uploads/162148ec-ffdc-44fc-b3e4-8c12ea142ee4_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','162148ec-ffdc-44fc-b3e4-8c12ea142ee4_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:39:11'),(12,'/uploads/fb904b86-950c-4aa1-8d41-ffd436ab3f99_2023-07-18 00 23 51.png','2023-07-18 00 23 51.png','fb904b86-950c-4aa1-8d41-ffd436ab3f99_2023-07-18 00 23 51.png','image/png',7273,'2025-05-30 12:41:01'),(13,'/uploads/abc440ec-d7e6-49bc-abac-7bb892ba2ee7_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','abc440ec-d7e6-49bc-abac-7bb892ba2ee7_2023-10-31 18 36 41.png','image/png',6068,'2025-05-30 12:41:01'),(14,'/uploads/51c1766d-28e1-4e77-8813-4f7e3684327b_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','51c1766d-28e1-4e77-8813-4f7e3684327b_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:41:01'),(15,'/uploads/3ce01a84-664b-4046-b3c5-89046f665226_카테고리.png','카테고리.png','3ce01a84-664b-4046-b3c5-89046f665226_카테고리.png','image/png',31852,'2025-05-30 12:41:02'),(16,'/uploads/6624c381-1536-40de-9638-0939d38fe6f4_40535_40479_5553.jpg','40535_40479_5553.jpg','6624c381-1536-40de-9638-0939d38fe6f4_40535_40479_5553.jpg','image/jpeg',98901,'2025-05-30 12:41:02'),(17,'/uploads/e1159850-4011-4a47-93af-7339b0a3128b_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','e1159850-4011-4a47-93af-7339b0a3128b_2023-10-31 18 36 41.png','image/png',6068,'2025-05-30 12:56:18'),(18,'/uploads/3d2005aa-75c7-4dbc-95c5-57c95ebccfac_2023-07-18 00 23 51.png','2023-07-18 00 23 51.png','3d2005aa-75c7-4dbc-95c5-57c95ebccfac_2023-07-18 00 23 51.png','image/png',7273,'2025-05-30 12:56:18'),(19,'/uploads/f9f7bbda-c813-48a7-94ba-446e950b194d_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','f9f7bbda-c813-48a7-94ba-446e950b194d_2024-01-01 06 21 07.png','image/png',3549168,'2025-05-30 12:56:18'),(20,'/uploads/e5dcb33a-a385-4c16-a9cf-95d4f72e76cf_카테고리.png','카테고리.png','e5dcb33a-a385-4c16-a9cf-95d4f72e76cf_카테고리.png','image/png',31852,'2025-05-30 12:56:20'),(21,'/uploads/f3e6093d-bf16-4630-8fe1-e791fce1384d_40535_40479_5553.jpg','40535_40479_5553.jpg','f3e6093d-bf16-4630-8fe1-e791fce1384d_40535_40479_5553.jpg','image/jpeg',98901,'2025-05-30 12:56:20'),(22,'/uploads/4cc4a4dd-9725-4df0-a5a1-8ecba27d38b7_카테고리.png','카테고리.png','4cc4a4dd-9725-4df0-a5a1-8ecba27d38b7_카테고리.png','image/png',31852,'2025-06-05 14:07:40'),(23,'/uploads/cce88a72-b199-452c-a54f-b787506ba905_client_server.png','client_server.png','cce88a72-b199-452c-a54f-b787506ba905_client_server.png','image/png',21608,'2025-06-05 14:07:40'),(24,'/uploads/f985134d-21c5-4270-84b6-9721c31e2328_e5dcb33a-a385-4c16-a9cf-95d4f72e76cf_카테고리.png','e5dcb33a-a385-4c16-a9cf-95d4f72e76cf_카테고리.png','f985134d-21c5-4270-84b6-9721c31e2328_e5dcb33a-a385-4c16-a9cf-95d4f72e76cf_카테고리.png','image/png',31852,'2025-06-05 14:55:37'),(25,'/uploads/25fe012c-e298-443c-bbcc-d7112daa30d0_40535_40479_5553.jpg','40535_40479_5553.jpg','25fe012c-e298-443c-bbcc-d7112daa30d0_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-05 15:52:14'),(26,'/uploads/46fed159-afff-4fc2-8d07-fbc22211175b_40535_40479_5553.jpg','40535_40479_5553.jpg','46fed159-afff-4fc2-8d07-fbc22211175b_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-05 15:55:28'),(27,'/uploads/56e24297-3db5-4c19-8e28-2a0a9abcd0e1_40535_40479_5553.jpg','40535_40479_5553.jpg','56e24297-3db5-4c19-8e28-2a0a9abcd0e1_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-05 15:55:59'),(28,'/uploads/52385309-6bc2-4d0f-9d14-bf6a4286ef66_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','52385309-6bc2-4d0f-9d14-bf6a4286ef66_2023-10-31 18 36 41.png','image/png',6068,'2025-06-05 15:56:05'),(29,'/uploads/67a0046b-35de-4c87-8d91-4d396df4804d_icann2010_maxpool.pdf','icann2010_maxpool.pdf','67a0046b-35de-4c87-8d91-4d396df4804d_icann2010_maxpool.pdf','application/pdf',290849,'2025-06-05 15:56:11'),(30,'/uploads/ba6dc478-c93b-4bbd-946d-52987a8950c0_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','ba6dc478-c93b-4bbd-946d-52987a8950c0_2024-01-01 06 21 07.png','image/png',3549168,'2025-06-07 12:30:47'),(31,'/uploads/a3ec2f22-d5dd-423e-95e2-049c79fb4e6c_avutil-56.dll','avutil-56.dll','a3ec2f22-d5dd-423e-95e2-049c79fb4e6c_avutil-56.dll','application/x-msdownload',780288,'2025-06-07 13:48:24'),(32,'/uploads/38e45edf-d01f-40d1-b566-e88cd02e4d86_banres.txt','banres.txt','38e45edf-d01f-40d1-b566-e88cd02e4d86_banres.txt','text/plain',37,'2025-06-07 13:48:24'),(33,'/uploads/9ba1d642-d41d-4b00-9881-9cb74f492c48_avutil-56.dll','avutil-56.dll','9ba1d642-d41d-4b00-9881-9cb74f492c48_avutil-56.dll','application/x-msdownload',780288,'2025-06-07 13:49:47'),(34,'/uploads/44c8fb0d-dfdf-4494-aaa6-0189fbd59327_banres.txt','banres.txt','44c8fb0d-dfdf-4494-aaa6-0189fbd59327_banres.txt','text/plain',37,'2025-06-07 13:49:47'),(35,'/uploads/ac8c0206-a961-4ddd-a80f-b25b94def45f_카테고리.png','카테고리.png','ac8c0206-a961-4ddd-a80f-b25b94def45f_카테고리.png','image/png',31852,'2025-06-07 13:51:15'),(36,'/uploads/2adead11-f6ba-4723-a556-63d5b39b3741_RtspToWebRTCExampleJava.war','RtspToWebRTCExampleJava.war','2adead11-f6ba-4723-a556-63d5b39b3741_RtspToWebRTCExampleJava.war','application/octet-stream',13770268,'2025-06-07 13:51:15'),(37,'/uploads/2acc7499-5752-456d-aec1-1697e6242196_icann2010_maxpool.pdf','icann2010_maxpool.pdf','2acc7499-5752-456d-aec1-1697e6242196_icann2010_maxpool.pdf','application/pdf',290849,'2025-06-07 13:51:15'),(38,'/uploads/b69261db-579c-4b37-a465-5e8985086bdb_레시피.txt','레시피.txt','b69261db-579c-4b37-a465-5e8985086bdb_레시피.txt','text/plain',1437,'2025-06-07 13:51:15'),(39,'/uploads/e1f27807-f733-44c7-ac02-fd8aded0ceca_카테고리.png','카테고리.png','e1f27807-f733-44c7-ac02-fd8aded0ceca_카테고리.png','image/png',31852,'2025-06-07 13:52:27'),(40,'/uploads/c7450796-181b-473c-887c-fbdcd15bd4e9_RtspToWebRTCExampleJava.war','RtspToWebRTCExampleJava.war','c7450796-181b-473c-887c-fbdcd15bd4e9_RtspToWebRTCExampleJava.war','application/octet-stream',13770268,'2025-06-07 13:52:27'),(41,'/uploads/553bbb06-9e6d-4487-83ae-2a41489e078a_icann2010_maxpool.pdf','icann2010_maxpool.pdf','553bbb06-9e6d-4487-83ae-2a41489e078a_icann2010_maxpool.pdf','application/pdf',290849,'2025-06-07 13:52:27'),(42,'/uploads/0b07e792-8ec9-4d4e-b85e-8d816a56e8f4_레시피.txt','레시피.txt','0b07e792-8ec9-4d4e-b85e-8d816a56e8f4_레시피.txt','text/plain',1437,'2025-06-07 13:52:27'),(43,'/uploads/265c9826-cd71-49a3-b11f-6319ee2ccecc_banres.txt','banres.txt','265c9826-cd71-49a3-b11f-6319ee2ccecc_banres.txt','text/plain',37,'2025-06-08 07:59:03'),(44,'/uploads/4325f02e-665d-4486-bd9e-95af7959afd0_40535_40479_5553.jpg','40535_40479_5553.jpg','4325f02e-665d-4486-bd9e-95af7959afd0_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-08 08:46:25'),(45,'/uploads/8e7137c5-a9ec-4a09-b3f0-b848debee317_avfilter-7.dll','avfilter-7.dll','8e7137c5-a9ec-4a09-b3f0-b848debee317_avfilter-7.dll','application/x-msdownload',7353856,'2025-06-08 08:46:29'),(46,'/uploads/bc2475a5-8e72-481b-852f-45ecd3bca41c_avformat-58.dll','avformat-58.dll','bc2475a5-8e72-481b-852f-45ecd3bca41c_avformat-58.dll','application/x-msdownload',9960448,'2025-06-08 08:46:29'),(47,'/uploads/0b7ebdd5-5a87-47e4-833b-3810a17ba24d_레시피.txt','레시피.txt','0b7ebdd5-5a87-47e4-833b-3810a17ba24d_레시피.txt','text/plain',1437,'2025-06-08 09:35:51'),(48,'/uploads/670a33d9-bd0d-4b81-90e3-2c4d50136a8a_레시피.txt','레시피.txt','670a33d9-bd0d-4b81-90e3-2c4d50136a8a_레시피.txt','text/plain',1437,'2025-06-08 09:35:53'),(49,'/uploads/2066888d-9b4f-40f1-99d4-6d4857153655_카테고리.png','카테고리.png','2066888d-9b4f-40f1-99d4-6d4857153655_카테고리.png','image/png',31852,'2025-06-08 13:31:41'),(50,'/uploads/bef922a0-56e2-48a6-95b5-6d3ea526b136_40535_40479_5553.jpg','40535_40479_5553.jpg','bef922a0-56e2-48a6-95b5-6d3ea526b136_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-08 14:51:41'),(51,'/uploads/34c791ed-2d6e-4507-bad4-58752fd55cd3_카테고리.png','카테고리.png','34c791ed-2d6e-4507-bad4-58752fd55cd3_카테고리.png','image/png',31852,'2025-06-08 15:04:05'),(52,'/uploads/f2eb9eae-d4bc-4cce-aa3f-d057d25fbed8_카테고리 (3).png','카테고리 (3).png','f2eb9eae-d4bc-4cce-aa3f-d057d25fbed8_카테고리 (3).png','image/png',31852,'2025-06-09 08:59:46'),(53,'/uploads/a6e93ef4-f1c7-407a-87ed-82a38bce1934_Untitled.png','Untitled.png','a6e93ef4-f1c7-407a-87ed-82a38bce1934_Untitled.png','image/png',370942,'2025-06-15 04:38:37'),(54,'/uploads/8bc0c7b3-4ae5-4bb5-a27c-fa9c76488fc7_40535_40479_5553.jpg','40535_40479_5553.jpg','8bc0c7b3-4ae5-4bb5-a27c-fa9c76488fc7_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-28 14:38:27'),(55,'/uploads/3ac02a82-e48c-41a3-a551-bbdb000abbd6_2024-01-01 06 21 07.png','2024-01-01 06 21 07.png','3ac02a82-e48c-41a3-a551-bbdb000abbd6_2024-01-01 06 21 07.png','image/png',3549168,'2025-06-28 14:43:25'),(56,'/uploads/7673807c-3ddc-4cea-8370-af47eaafaa30_client_server.png','client_server.png','7673807c-3ddc-4cea-8370-af47eaafaa30_client_server.png','image/png',21608,'2025-06-28 15:21:47'),(57,'/uploads/0b0b51de-2565-40ea-9bf9-659ed7316edc_2023-10-31 18 36 41.png','2023-10-31 18 36 41.png','0b0b51de-2565-40ea-9bf9-659ed7316edc_2023-10-31 18 36 41.png','image/png',6068,'2025-06-28 15:22:27'),(58,'/uploads/a431ec1c-9b2e-40ae-8b5c-eb95ce475897_cleint_router_switch.png','cleint_router_switch.png','a431ec1c-9b2e-40ae-8b5c-eb95ce475897_cleint_router_switch.png','image/png',46096,'2025-06-28 15:23:14'),(59,'/uploads/d69b4e93-016e-46b9-90a1-322ca181840e_client_server.png','client_server.png','d69b4e93-016e-46b9-90a1-322ca181840e_client_server.png','image/png',21608,'2025-06-28 15:25:19'),(60,'/uploads/c7461161-928c-41ee-a5bc-32b6db6f2f1a_40535_40479_5553.jpg','40535_40479_5553.jpg','c7461161-928c-41ee-a5bc-32b6db6f2f1a_40535_40479_5553.jpg','image/jpeg',98901,'2025-06-29 05:58:09');
/*!40000 ALTER TABLE `file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '자재 고유 id',
  `name` varchar(255) NOT NULL COMMENT '자재 이름 ex) 아시바, 우드락',
  `category_id` bigint NOT NULL COMMENT '분야 카테고리 고유 id',
  `material_category_id` bigint NOT NULL COMMENT '자재 카테고리 고유 id',
  `partner_id` varchar(255) NOT NULL COMMENT '자재 등록 협력사 아이디',
  `unit` varchar(50) DEFAULT NULL COMMENT '자재 단위 ex) 개, mm, m, inch',
  `price` decimal(15,2) DEFAULT NULL COMMENT '자재 단가',
  `description` text COMMENT '자재 설명',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '자재 표출 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '자재 등록일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '자재 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `partner_id` (`partner_id`),
  KEY `idx_category_deleted_partner` (`material_category_id`,`deleted_at`,`partner_id`),
  CONSTRAINT `material_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `material_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partner_company` (`id`),
  CONSTRAINT `material_ibfk_3` FOREIGN KEY (`material_category_id`) REFERENCES `material_category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자재 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
INSERT INTO `material` VALUES (2,'각목',37,8,'aaaaaaa',NULL,111.00,'ㅁㅁㅁㅁ',1,'2025-06-08 13:31:41','2025-06-22 12:07:54',NULL),(3,'sss',42,9,'aaaaaaa',NULL,11111.00,'aaa',1,'2025-06-08 15:04:05','2025-06-22 12:07:53',NULL),(4,'ㅇㅇ',37,10,'aaaaaaa',NULL,111111.00,'ㅇㅇ',1,'2025-06-15 04:38:37','2025-06-16 13:03:25',NULL);
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_category`
--

DROP TABLE IF EXISTS `material_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '자재 카테고리 고유 id',
  `name` varchar(100) NOT NULL COMMENT '자재 카테고리 이름 ex) 목재, 석재',
  `parent_id` bigint DEFAULT NULL COMMENT '부모 자재 카테고리 아이디',
  `depth` int DEFAULT '0' COMMENT '계층 수준 0 : 대분류, 1 : 중분류',
  `display_order` int DEFAULT '0' COMMENT '정렬 순서',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '자재 카테고리 사용 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '자재 카테고리 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '자재 카테고리 수정일',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `material_category_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `material_category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자재 카테고리 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_category`
--

LOCK TABLES `material_category` WRITE;
/*!40000 ALTER TABLE `material_category` DISABLE KEYS */;
INSERT INTO `material_category` VALUES (1,'목제',NULL,0,0,1,'2025-06-04 12:40:54','2025-06-04 12:45:46'),(2,'실내마감제',NULL,0,0,1,'2025-06-04 12:41:16','2025-06-04 12:45:55'),(3,'실외마감제',NULL,0,0,1,'2025-06-04 12:41:29','2025-06-04 12:46:02'),(4,'석고',NULL,0,0,1,'2025-06-04 12:41:36','2025-06-04 12:46:06'),(5,'단열제',NULL,0,0,1,'2025-06-04 12:42:22','2025-06-04 12:46:10'),(8,'각목',1,0,0,1,'2025-06-16 11:12:38','2025-06-28 11:33:17'),(9,'판자',1,0,0,1,'2025-06-16 11:12:45',NULL),(10,'하위',2,0,0,1,'2025-06-16 13:03:05',NULL);
/*!40000 ALTER TABLE `material_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_file`
--

DROP TABLE IF EXISTS `material_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '자재 파일 고유 id',
  `material_id` bigint NOT NULL COMMENT '자재 고유 id',
  `file_id` bigint NOT NULL COMMENT '파일 고유 id',
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `material_file_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `material` (`id`),
  CONSTRAINT `material_file_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `file` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자재 파일 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_file`
--

LOCK TABLES `material_file` WRITE;
/*!40000 ALTER TABLE `material_file` DISABLE KEYS */;
INSERT INTO `material_file` VALUES (1,2,49),(2,2,50),(3,3,51),(4,4,53);
/*!40000 ALTER TABLE `material_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_company`
--

DROP TABLE IF EXISTS `partner_company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_company` (
  `id` varchar(255) NOT NULL COMMENT '협력사 고유 id',
  `description_html` text COMMENT '협력사 소개 문구',
  `status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '협력사 승인상태 pending : 대기, approved : 승인, rejected : 반려',
  `category_id` bigint NOT NULL COMMENT '협력사 카테고리 아이디',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '협력사 신청일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '협력사 정보 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '협력사 탈퇴일',
  PRIMARY KEY (`id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `partner_company_ibfk_1` FOREIGN KEY (`id`) REFERENCES `company` (`id`),
  CONSTRAINT `partner_company_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='협력사 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_company`
--

LOCK TABLES `partner_company` WRITE;
/*!40000 ALTER TABLE `partner_company` DISABLE KEYS */;
INSERT INTO `partner_company` VALUES ('aaaaaaa','소개글~','approved',37,'2025-06-04 11:29:23','2025-06-28 11:56:51',NULL),('aaaaaaa','<p>ㅁ</p>','rejected',42,'2025-06-08 11:28:23','2025-06-28 11:45:54',NULL);
/*!40000 ALTER TABLE `partner_company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_file`
--

DROP TABLE IF EXISTS `partner_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '협력사 파일 고유 id',
  `partner_id` varchar(255) NOT NULL COMMENT '협력사 아이디',
  `file_id` bigint NOT NULL COMMENT '파일 고유 id',
  PRIMARY KEY (`id`),
  KEY `partner_id` (`partner_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `partner_file_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partner_company` (`id`),
  CONSTRAINT `partner_file_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `file` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='협력사 파일 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_file`
--

LOCK TABLES `partner_file` WRITE;
/*!40000 ALTER TABLE `partner_file` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `persistent_logins`
--

DROP TABLE IF EXISTS `persistent_logins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `persistent_logins` (
  `series` varchar(64) NOT NULL COMMENT '자동로그인 고유 id',
  `username` varchar(64) NOT NULL COMMENT '자동로그인 유저 아이디',
  `token` varchar(64) NOT NULL COMMENT '자동로그인 유저 토큰',
  `last_used` timestamp NOT NULL COMMENT '자동로그인 마지막 로그인 일시',
  PRIMARY KEY (`series`),
  KEY `username` (`username`),
  CONSTRAINT `persistent_logins_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자동로그인 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `persistent_logins`
--

LOCK TABLES `persistent_logins` WRITE;
/*!40000 ALTER TABLE `persistent_logins` DISABLE KEYS */;
/*!40000 ALTER TABLE `persistent_logins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `popup`
--

DROP TABLE IF EXISTS `popup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `popup` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '팝업 고유 ID',
  `title` varchar(255) NOT NULL COMMENT '팝업 제목',
  `content_html` text COMMENT '팝업 본문 HTML',
  `start_at` datetime NOT NULL COMMENT '노출 시작일시',
  `end_at` datetime NOT NULL COMMENT '노출 종료일시',
  `is_visible` tinyint(1) DEFAULT '1' COMMENT '출력 여부 (ON/OFF)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='팝업 관리 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `popup`
--

LOCK TABLES `popup` WRITE;
/*!40000 ALTER TABLE `popup` DISABLE KEYS */;
/*!40000 ALTER TABLE `popup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `region_category`
--

DROP TABLE IF EXISTS `region_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `region_category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '지역 카테고리 고유 id',
  `name` varchar(100) NOT NULL COMMENT '지역 명',
  `parent_id` bigint DEFAULT NULL COMMENT '상위 지역 카테고리 id',
  `depth` int DEFAULT '0' COMMENT '계층 수준 0 : 시 도, 1: 시군구, 2 : 읍면동',
  `display_order` int DEFAULT '0' COMMENT '정렬 순서',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '지역 카테고리 사용 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '지역 카테고리 등록일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '지역 카테고리 수정일',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `region_category_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `region_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='지역 카테고리 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `region_category`
--

LOCK TABLES `region_category` WRITE;
/*!40000 ALTER TABLE `region_category` DISABLE KEYS */;
INSERT INTO `region_category` VALUES (3,'경기도',NULL,0,0,1,'2025-05-26 11:21:28','2025-05-26 11:27:45'),(5,'ㅁㅁㅁ',NULL,0,0,0,'2025-05-26 11:27:12','2025-05-26 11:27:26'),(8,'수원',3,0,0,1,'2025-05-26 11:27:49',NULL),(9,'안양',3,0,0,1,'2025-05-26 11:30:39',NULL),(10,'밀양',3,0,0,1,'2025-05-26 11:33:07',NULL),(11,'의정부',3,0,0,1,'2025-05-26 11:33:23',NULL),(12,'dfddd',3,0,0,1,'2025-05-26 11:33:28','2025-05-28 14:09:16');
/*!40000 ALTER TABLE `region_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '회원 권한 고유id',
  `name` varchar(50) NOT NULL COMMENT '회원 권한 이름 ex) ROLE_USER, ROLE_PARTNER, ROLE_ADMIN 등',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 권한 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (3,'ROLE_ADMIN'),(2,'ROLE_PARTNER'),(1,'ROLE_USER');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `signup_question`
--

DROP TABLE IF EXISTS `signup_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signup_question` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '회원가입 질문 고유id',
  `question` varchar(255) NOT NULL COMMENT '회원가입 질문',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '회원가입 질문 활성화 플래그',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '회원가입 질문 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '회원가입 질문 수정일',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원가입 질문 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signup_question`
--

LOCK TABLES `signup_question` WRITE;
/*!40000 ALTER TABLE `signup_question` DISABLE KEYS */;
INSERT INTO `signup_question` VALUES (1,'다시 태어나면 되고 싶은 것은?',1,'2025-05-27 12:00:21',NULL),(2,'자신의 인생 좌우명은?',1,'2025-05-27 12:00:21',NULL),(3,'자신의 보물 제1호는?',1,'2025-05-27 12:00:21',NULL),(4,'제일 가보고 싶은 나라는?',1,'2025-05-27 12:00:21',NULL),(5,'제일 좋아하는 단어는?',1,'2025-05-27 12:00:21',NULL),(6,'제일 좋아하는 색깔은?',1,'2025-05-27 12:00:21',NULL),(7,'제일 좋아하는 캐릭터는?',1,'2025-05-27 12:00:21',NULL),(8,'제일 좋아하는 계절은?',1,'2025-05-27 12:00:21',NULL),(9,'제일 좋아하는 연예인은?',1,'2025-05-27 12:00:21',NULL),(10,'제일 좋아하는 스포츠는?',1,'2025-05-27 12:00:21',NULL),(11,'제일 좋아하는 영화는?',1,'2025-05-27 12:00:21',NULL),(12,'제일 좋아하는 장소는?',1,'2025-05-27 12:00:21',NULL);
/*!40000 ALTER TABLE `signup_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_action_log`
--

DROP TABLE IF EXISTS `user_action_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_action_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '사용자 활동 로그 고유 id',
  `acted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '활동 일시',
  `user_id` varchar(255) DEFAULT NULL COMMENT '회원 아이디',
  `user_ip` varchar(45) NOT NULL COMMENT '활동 ip',
  `action_type` enum('login','logout','insert','update','delete','etc') NOT NULL COMMENT '동작 유형',
  `target_uri` varchar(500) DEFAULT NULL COMMENT '접근 경로',
  `parameters` text COMMENT '요청 파라미터',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_action_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사용자 활동 로그 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_action_log`
--

LOCK TABLES `user_action_log` WRITE;
/*!40000 ALTER TABLE `user_action_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_action_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL COMMENT '회원 아이디',
  `password` varchar(255) NOT NULL COMMENT '회원 비밀번호',
  `name` varchar(50) NOT NULL COMMENT '회원 이름',
  `nick_name` varchar(50) NOT NULL COMMENT '회원 이름',
  `phone_mobile` varchar(20) NOT NULL COMMENT '회원 휴대전화 번호',
  `phone_home` varchar(20) DEFAULT NULL COMMENT '회원 일반 전화번호',
  `email` varchar(100) NOT NULL COMMENT '회원 이메일',
  `question1_id` bigint NOT NULL COMMENT '회원가입 질문1',
  `answer1` varchar(255) NOT NULL COMMENT '회원가입 답변1',
  `question2_id` bigint NOT NULL COMMENT '회원가입 질문2',
  `answer2` varchar(255) NOT NULL COMMENT '회원가입 답변2',
  `sms_agree` tinyint(1) DEFAULT '0' COMMENT 'SMS 수신동의 여부',
  `email_agree` tinyint(1) DEFAULT '0' COMMENT '이메일 수신동의 여부',
  `ad_agree` tinyint(1) DEFAULT '0' COMMENT '광고성 정보 수신 동의 여부',
  `terms_agree` tinyint(1) NOT NULL COMMENT '이용약관 동의 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '회원가입일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '회원정보수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '회원탈퇴일',
  `role` bigint NOT NULL DEFAULT '1' COMMENT '회원 권한',
  PRIMARY KEY (`id`),
  KEY `question1_id` (`question1_id`),
  KEY `question2_id` (`question2_id`),
  KEY `role` (`role`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`question1_id`) REFERENCES `signup_question` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`question2_id`) REFERENCES `signup_question` (`id`),
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('aa','$2a$10$bHVYfITcBVfdX534H9JXku4vZRRruGhB8Mdm4isdKolNEUMi91cPi','김봉준','aaa','1212-341-2322','','nocdu1124@gmail.com',1,'a',3,'a',1,1,1,1,'2025-05-27 13:33:45','2025-05-28 12:37:20',NULL,2),('aaaaaaa','$2a$10$xbLHz2DCaDBvurQcT3RXKOUTKEFgm55fBiw6rVArGbsSwLtU7I4pS','김봉준','aabㄴㄴ','1212-341-2321','010-123-4567','nocdu1123@gmail.com',1,'aasdㅎ',3,'a',0,0,1,1,'2025-05-27 13:33:45','2025-06-22 06:18:20',NULL,2);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitor_log`
--

DROP TABLE IF EXISTS `visitor_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '접속 로그 고유 id',
  `visited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '접속 일시',
  `ip_address` varchar(45) NOT NULL COMMENT '접속 ip',
  `browser` varchar(100) DEFAULT NULL COMMENT '접속 브라우저',
  `os` varchar(100) DEFAULT NULL COMMENT '접속 OS',
  `referer` varchar(500) DEFAULT NULL COMMENT '이전 페이지(접속 url)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='접속 로그 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitor_log`
--

LOCK TABLES `visitor_log` WRITE;
/*!40000 ALTER TABLE `visitor_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `visitor_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_field`
--

DROP TABLE IF EXISTS `work_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_field` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '업무 분야 고유 id',
  `name` varchar(100) NOT NULL COMMENT '업무 분야 명',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '멉무 분야 사용여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '업무 분야 생성일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '업무 분야 수정일',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업무 분야 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_field`
--

LOCK TABLES `work_field` WRITE;
/*!40000 ALTER TABLE `work_field` DISABLE KEYS */;
INSERT INTO `work_field` VALUES (2,'목수',1,'2025-06-04 13:05:53','2025-06-04 13:11:06'),(3,'철거',1,'2025-06-04 13:11:09',NULL),(4,'설비',1,'2025-06-04 13:11:11',NULL),(5,'전기',1,'2025-06-04 13:11:14',NULL),(7,'미장',1,'2025-06-04 13:11:20',NULL),(8,'조적',1,'2025-06-04 13:11:23',NULL),(9,'도배',1,'2025-06-04 13:11:26',NULL),(10,'장판',1,'2025-06-04 13:11:28',NULL),(11,'타일',1,'2025-06-04 13:11:31',NULL);
/*!40000 ALTER TABLE `work_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worker`
--

DROP TABLE IF EXISTS `worker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker` (
  `user_id` varchar(255) NOT NULL COMMENT '회원 아이디',
  `region_id` bigint NOT NULL COMMENT '활동 지역 카테고리',
  `introduction` text COMMENT '인력 풀 소개 문구',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'approved' COMMENT '인력풀 승인상태 pending : 대기, approved : 승인, rejected : 반려',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '인력 풀 등록일',
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '인력 풀 수정일',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '인력 풀 삭제일',
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `region_id` (`region_id`),
  CONSTRAINT `worker_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `worker_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `region_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='인력 풀 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worker`
--

LOCK TABLES `worker` WRITE;
/*!40000 ALTER TABLE `worker` DISABLE KEYS */;
INSERT INTO `worker` VALUES ('aaaaaaa',9,'<p>hiㅁㅁㅁㅁ</p>','approved','2025-06-05 14:07:40','2025-06-29 06:56:03',NULL,'ㅇㅇㅋㅋㅁㅁ');
/*!40000 ALTER TABLE `worker` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worker_field`
--

DROP TABLE IF EXISTS `worker_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker_field` (
  `user_id` varchar(255) NOT NULL COMMENT '회원 아이디',
  `field_id` bigint NOT NULL COMMENT '업무분야 아이디',
  PRIMARY KEY (`user_id`,`field_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `worker_field_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `worker` (`user_id`),
  CONSTRAINT `worker_field_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `work_field` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='인력풀 업무 분야 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worker_field`
--

LOCK TABLES `worker_field` WRITE;
/*!40000 ALTER TABLE `worker_field` DISABLE KEYS */;
INSERT INTO `worker_field` VALUES ('aaaaaaa',2),('aaaaaaa',3),('aaaaaaa',4),('aaaaaaa',5),('aaaaaaa',7);
/*!40000 ALTER TABLE `worker_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worker_file`
--

DROP TABLE IF EXISTS `worker_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker_file` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '인력풀 파일 고유 id',
  `user_id` varchar(255) NOT NULL COMMENT '회원 아이디',
  `file_id` bigint NOT NULL COMMENT '파일 고유 id',
  `file_type` int NOT NULL COMMENT '첨부파일 타입 ex) 1 : 대표이미지, 2 : 포트폴리오',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `worker_file_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `worker` (`user_id`),
  CONSTRAINT `worker_file_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `file` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='인력 풀 파일 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worker_file`
--

LOCK TABLES `worker_file` WRITE;
/*!40000 ALTER TABLE `worker_file` DISABLE KEYS */;
INSERT INTO `worker_file` VALUES (3,'aaaaaaa',28,1),(4,'aaaaaaa',29,2);
/*!40000 ALTER TABLE `worker_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'ktop'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-02 21:04:18
