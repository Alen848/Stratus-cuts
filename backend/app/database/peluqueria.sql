-- Crear base de datos
CREATE DATABASE IF NOT EXISTS peluqueria;
USE peluqueria;

-- =========================
-- USUARIOS DEL SISTEMA
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin','empleado') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CLIENTES
-- =========================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(100),
    notas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- EMPLEADOS / BARBEROS
-- =========================
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    usuario_id INT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =========================
-- SERVICIOS
-- =========================
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_min INT NOT NULL,        -- duración del servicio
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- =========================
-- HORARIOS LABORALES EMPLEADOS
-- =========================
CREATE TABLE horarios_empleado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    dia_semana ENUM('lunes','martes','miercoles','jueves','viernes','sabado','domingo'),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- =========================
-- TURNOS
-- =========================
CREATE TABLE turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    empleado_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('pendiente','confirmado','cancelado','completado') DEFAULT 'pendiente',
    notas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),

    INDEX idx_fecha_empleado (empleado_id, fecha),
    INDEX idx_fecha (fecha)
);

-- =========================
-- RELACION TURNOS - SERVICIOS
-- (un turno puede tener varios servicios)
-- =========================
CREATE TABLE turno_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    servicio_id INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    duracion_min INT NOT NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- =========================
-- PAGOS
-- =========================
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('efectivo','tarjeta','transferencia','mercadopago'),
    estado ENUM('pendiente','pagado','reembolsado') DEFAULT 'pendiente',
    pagado_en TIMESTAMP NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);

-- =========================
-- BLOQUEOS DE AGENDA
-- (vacaciones, almuerzo, etc.)
-- =========================
CREATE TABLE bloqueos_agenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo VARCHAR(255),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);
