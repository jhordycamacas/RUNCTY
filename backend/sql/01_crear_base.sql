-- Crea la base de datos y el usuario de la aplicación RUNCTY.
-- Ejecutar una sola vez como root (MySQL 8.4, puerto 3307):
--   mysql -u root -p -P 3307 -h 127.0.0.1 < sql/01_crear_base.sql
-- Antes de ejecutarlo, cambie 'CAMBIAR_CLAVE' por la misma clave que pondrá en DB_PASSWORD de backend/.env.

CREATE DATABASE IF NOT EXISTS runcty
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'runcty_app'@'localhost' IDENTIFIED BY 'CAMBIAR_CLAVE';
CREATE USER IF NOT EXISTS 'runcty_app'@'127.0.0.1' IDENTIFIED BY 'CAMBIAR_CLAVE';

GRANT ALL PRIVILEGES ON runcty.* TO 'runcty_app'@'localhost';
GRANT ALL PRIVILEGES ON runcty.* TO 'runcty_app'@'127.0.0.1';

-- Django crea y borra test_runcty al ejecutar "python manage.py test".
GRANT ALL PRIVILEGES ON test_runcty.* TO 'runcty_app'@'localhost';
GRANT ALL PRIVILEGES ON test_runcty.* TO 'runcty_app'@'127.0.0.1';

FLUSH PRIVILEGES;
