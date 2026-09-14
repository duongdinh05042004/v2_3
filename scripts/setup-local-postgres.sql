-- Chạy trên PostgreSQL local bằng user postgres (pgAdmin Query Tool).

DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tiktok') THEN
    CREATE ROLE tiktok LOGIN PASSWORD 'tiktok_secret';
  ELSE
    ALTER ROLE tiktok WITH LOGIN PASSWORD 'tiktok_secret';
  END IF;
END
$$;

-- Nếu database chưa có thì bỏ comment dòng dưới rồi chạy lần nữa:
-- CREATE DATABASE tiktok_bitrix24 OWNER tiktok;
