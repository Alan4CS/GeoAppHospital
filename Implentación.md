# Manual de Implementación - GeoAppHospital

## Descripción General
GeoAppHospital es una plataforma web para la gestión y monitoreo de hospitales, empleados y reportes, con funcionalidades de geolocalización y administración de usuarios. El proyecto está compuesto por un backend (API REST), un frontend (aplicación web), y scripts de apoyo en Python para procesamiento de datos.

## Tecnologías Utilizadas

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Base de Datos:** PostgreSQL (motor de base de datos principal)
- **Python:** Scripts para procesamiento y carga de datos
- **Otros:** PostCSS, ESLint

## Estructura del Proyecto

```
GeoAppHospital/
├── geoapp-backend/        # Backend Node.js/Express
├── hospital-tracker/      # Frontend React/Vite
├── Python_hacks/          # Scripts y utilidades en Python
└── Documentación          # Archivos PDF de documentación
```

## Requisitos Previos

- Node.js (v16+ recomendado)
- npm o yarn
- Python 3.8+
- PostgreSQL (v12+ recomendado) - Base de datos utilizada en la implementación actual

> **Nota:** El proyecto está desarrollado y configurado para PostgreSQL. Aunque es posible migrar a MySQL u otros motores de base de datos, la implementación actual utiliza PostgreSQL con todas las configuraciones, schemas y queries optimizadas para este motor.


## Despliegue en Línea (Cloud)

Las principales partes del proyecto pueden ser montadas y ejecutadas en línea usando servicios como Render:

- **Backend:** Puede desplegarse en Render como un servicio web. Solo necesitas subir el contenido de `geoapp-backend/` y configurar las variables de entorno (por ejemplo, claves de conexión a la base de datos, puertos, etc.).
- **Base de Datos:** Render permite crear instancias de PostgreSQL. Configura la base de datos PostgreSQL en Render y actualiza las variables de entorno del backend para apuntar a la URL de la base de datos en la nube.
- **Frontend:** El contenido de `hospital-tracker/` puede desplegarse en Render como una aplicación web estática. Render compilará el proyecto y lo servirá en línea.

Esto permite que el sistema funcione completamente en la nube, sin necesidad de ejecutarlo localmente. Solo asegúrate de que las URLs y credenciales estén correctamente configuradas en los archivos `.env` de cada módulo.

También puedes ejecutar cada parte localmente siguiendo los pasos de instalación y configuración descritos abajo.

---
## Instalación y Configuración

### 1. Clonar el repositorio

```powershell
git clone <URL-del-repositorio>
cd GeoAppHospital
```

### 2. Instalar dependencias del backend

```powershell
cd geoapp-backend
npm install
```

### 3. Instalar dependencias del frontend

```powershell
cd ../hospital-tracker
npm install
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en `geoapp-backend/` y `hospital-tracker/` con las variables necesarias (ejemplo: conexión a la base de datos, claves API, etc.).

### 5. Inicializar la base de datos

Asegúrate de tener la base de datos corriendo y configurada según la documentación interna.

### 6. Ejecutar el backend

```powershell
cd geoapp-backend
npm start
```

### 7. Ejecutar el frontend

```powershell
cd ../hospital-tracker
npm run dev
```

## Uso

- Accede a la aplicación web en `http://localhost:5173` (o el puerto configurado en Vite)
- El backend estará disponible en el puerto configurado (por defecto `http://localhost:3000`)
- Consulta la documentación PDF para detalles específicos de cada módulo

## Notas Adicionales

- Revisa los archivos README.md en cada subcarpeta para instrucciones específicas
- Para despliegue en producción, configura correctamente las variables de entorno y utiliza servicios como PM2, Docker, o servidores cloud

## Contacto y Soporte

Para dudas más especificas revisa la documentación incluida en los .pdf `Documentación backend, Documentación de la Base de Datos y Documentación frontend`.