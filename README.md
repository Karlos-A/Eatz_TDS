# Eatz - Sistema SaaS de Pedidos Directos para Restaurantes

Proyecto de Backend para la materia **Tecnologías de Desarrollo en el Servidor (Otoño 2026)**.
Autores: **Karlos Acosta** y **Omara Cámara**.

## Entregable 1: Definición y Arquitectura Base

Esta primera iteración establece la infraestructura fundacional del sistema utilizando Node.js, Express, TypeScript y MongoDB ejecutándose en un contenedor de Docker.

### Características Principales
- **Arquitectura en capas:** Separación estricta de responsabilidades (`Routes -> Controllers -> Services -> Models`).
- **Lógica de Negocio Segura:** Los cálculos transaccionales (totales de pedidos) y la validación de propiedad (dueño de un restaurante) se ejecutan de manera aislada en la capa `Services`.
- **Persistencia en MongoDB:** Modelado relacional mediante `ObjectId` para las 4 entidades requeridas (`User`, `Restaurant`, `MenuItem`, `Order`).
- **Autenticación y Roles:** Autenticación *stateless* con **JSON Web Tokens (JWT)** y control de acceso basado en roles (`client` para dueños de restaurante, `user` para comensales).

## Requisitos Previos

- Node.js (v18 o superior)
- Docker y Docker Compose
- Insomnia, Postman o cualquier cliente HTTP para realizar pruebas.

## Instalación y Entorno Local

1. Clona este repositorio y navega a la carpeta del proyecto:
   ```bash
   git clone https://github.com/Karlos-A/Eatz_TDS.git
   cd Eatz_TDS
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Crea tu archivo de variables de entorno copiando la plantilla:
   ```bash
   cp .env.example .env
   ```

4. Levanta el contenedor de MongoDB en segundo plano usando Docker:
   ```bash
   docker compose up -d
   ```

5. Inicia el servidor de desarrollo en Node.js (con recarga automática mediante `tsx`):
   ```bash
   npm run dev
   ```

La aplicación estará disponible y escuchando peticiones en `http://localhost:3000`.

## Scripts Disponibles

- `npm run dev`: Levanta el servidor en modo desarrollo utilizando `tsx watch`.
- `npm run build`: Compila el proyecto de TypeScript a JavaScript estándar en la carpeta `/dist`.
- `npm start`: Inicia la aplicación desde el código compilado para ambientes de producción.

## Arquitectura

El flujo de una petición HTTP en Eatz sigue un patrón MVC extendido:
1. **Routes & Middlewares:** Reciben la petición, verifican el token JWT (`authenticate`) y validan que el rol tenga permisos (`authorize`).
2. **Controllers:** Extraen los parámetros, el cuerpo del request (JSON) y los datos del usuario logueado (`req.auth`), delegando la tarea al servicio.
3. **Services:** Contienen la lógica de negocio real. Calculan totales consultando los precios en la base de datos, verifican vigencias y lanzan errores HTTP controlados si se rompe una regla de negocio.
4. **Models:** Definen los esquemas y conexiones con **MongoDB** usando Mongoose.

## Documentación de la API

La API RESTful responde y consume formato `application/json`. Todas las rutas protegidas requieren el encabezado `Authorization: Bearer <Token>`.

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Registra una nueva cuenta (`client` o `user`) | Público |
| POST | `/login` | Inicia sesión y devuelve el token JWT | Público |

### Restaurantes (`/api/restaurants`)
| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| POST | `/` | Da de alta un nuevo restaurante | `client` |
| GET | `/` | Lista los restaurantes activos (acepta query `?search=`) | Público |
| GET | `/:id` | Detalle específico de un restaurante | Público |
| PUT | `/:id` | Actualiza la información (solo por el dueño) | `client` |
| DELETE | `/:id` | Desactiva el restaurante (soft delete) | `client` |

### Menú y Platillos (`/api/menu-items`)
| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| POST | `/` | Agrega un platillo al catálogo | `client` |
| GET | `/restaurant/:id` | Lista los platillos de un restaurante específico | Público |
| PUT | `/:id` | Actualiza datos (precio, disponibilidad) | `client` |
| DELETE | `/:id` | Elimina definitivamente el platillo | `client` |

### Pedidos Transaccionales (`/api/orders`)
| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| POST | `/` | Crea un pedido (total calculado en Backend) | `user` |
| GET | `/my-orders` | Lista el historial de pedidos del comensal | `user` |
| GET | `/restaurant/:id` | Bandeja de entrada de órdenes recibidas | `client` |
| PATCH | `/:id/status` | Actualiza el estado (`pending`, `preparing`, etc.) | `client` |
