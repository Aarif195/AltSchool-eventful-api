# Eventful Capstone API Engine

Eventful is a high-performance, production-grade event ticketing, application, and real-time sales analytics platform built as a final Capstone project at AltSchool Africa. The engine is architected around modular isolation, cryptographic validation layers, asynchronous task workers, and comprehensive role-based access control.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## Key Architectural Features

* **Role-Based Access Control (RBAC):** Strict operational segregation using custom NestJS Guards mapping two explicit personas:
  * `CREATOR`: Manage full lifecycle event listings, validate attendee codes, and view aggregation dashboards.
  * `EVENTEE`: Catalog discovery, automated booking triggers, secure ticket viewing, and notification profiling.
* **Cryptographic Ticketing Gate Engine:** Successful payments instantly mint unique tickets embedded with an HMAC-SHA256 signature token string (`ticketId.hashSignature`), rendering to secure Base64 QR code data URLs for frontend rendering.
* **Asynchronous Message Queue Pattern:** Built using **BullMQ** and **Redis (Key-Value)** to isolate bulk email dispatch overhead away from the main thread loop.
* **Automated Cron Scheduling Engine:** Daily midnight cron workers evaluate user alert preferences and push delivery payloads dynamically to a **Brevo SMTP API** transport handler.
* **Real-time Performance Analytics:** Optimized multi-layer Prisma database aggregation queries compiling total transaction sizes, velocity rates, and entry gate check-in percentages.

---

## Built With

* **Framework:** NestJS (Node.js) with TypeScript
* **Database:** PostgreSQL
* **ORM Layer:** Prisma ORM
* **Task Management:** BullMQ & Redis (Key-Value)
* **Email Provider Engine:** Brevo API (V3 SMTP)
* **Documentation Layer:** Swagger UI (OpenAPI Specification)
* **Security & Resilience:** Bcrypt, Passport-JWT, NestJS Throttler (Rate-Limiter)

---

## System Setup Requirements

### Environment Configurations
Create a `.env` file in the project's root directory and map the following operational variables:

```env
# Application Platform Execution Configurations
PORT=3000
ALLOWED_ORIGINS="*"
JWT_SECRET="your-super-secure-production-secret-key-for-eventful"

# Persistent Relational Data Store Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/student-welfare-platform?schema=public"

# Paystack API Gate Integration Parameters
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."

# Asynchronous Memory Data Buffer Layout
REDIS_HOST="localhost"
REDIS_PORT=6379

# Brevo SMTP Delivery Layer Credentials
BREVO_API_KEY="xkeysib-..."
MAIL_SENDER_EMAIL="your-registered-brevo-email@example.com"
MAIL_SENDER_NAME="Eventful Platform"
```

### Security Considerations
```
Global Pipes: Explicitly flags whitelist: true and forbidNonWhitelisted: true to scrub unexpected attributes away from input streams.

Brute-Force Shield: Universal ThrottlerGuard locks standard routes while enforcing a strict limit of 3 attempts per minute over sensitive authorization points (/auth/login, /auth/register).

Webhook Integrity: Paystack webhook endpoint mandates raw payload mapping via an independent buffer to calculate matching x-paystack-signature headers before processing balances.
```

---

### Database Migrations

```bash
# Create initial migration schema
$ npx prisma migrate dev --name init

# Apply migration after schema changes
$ npx prisma migrate deploy

# Generate new Prisma client from schema
$ npx prisma generate
```

### Project Live link

https://altschool-eventful-api.onrender.com/

### API Testing Documentation (Swagger)

Interactive API documentation is automatically served at the following endpoint:

```
https://altschool-eventful-api.onrender.com/api/docs/#/
```
