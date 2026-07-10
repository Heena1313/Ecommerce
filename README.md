# Apex E-Commerce Platform

A full-stack Node.js e-commerce application supporting multi-role users: **admin**, **vendor**, and **customer**.

## Features

- Role-based authentication and authorization
- Admin dashboard for vendor/customer management
- Vendor product management and store administration
- Customer browsing, shopping cart, checkout and order history
- PayPal payment integration
- JWT-based authentication with bcrypt password hashing
- MongoDB persistence via Mongoose
- Simple email helper for password reset flows

## Project Structure

- `server/` – Express backend and API routes
  - `config/` – environment and database setup
  - `middleware/` – auth and role checks
  - `models/` – Mongoose schemas
  - `routes/` – API endpoints for auth, admin, orders, products, reviews, stores
  - `scripts/seed.js` – seed data including default admin/vendor/customer
  - `utils/` – email utility helpers
- `public/` – front-end assets
  - `js/` – client-side logic for app, admin, vendor, customer views
  - `css/` – styles
  - `index.html` – app entry point
- `docker-compose.yml` – container setup (if configured)

## Prerequisites

- Node.js 18+ / 20+
- npm
- MongoDB running locally or remote

## Installation

1. Clone the repository

```bash
git clone <repo-url>
cd project03
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the project root and set values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
CLIENT_RESET_URL=http://localhost:3000/reset-password
```

4. Seed the database (creates default admin, vendor, and customer)

```bash
node server/scripts/seed.js
```

## Running the App

```bash
npm start
```

Then open:

- `http://localhost:3000`

## API Endpoints

- `POST /api/auth/register` — Register customer or vendor
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user profile
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/admin/vendors` — Admin only: list vendors
- `GET /api/admin/customers` — Admin only: list customers
- `PUT /api/admin/vendors/:id/status` — Admin only: approve/suspend vendor
- `GET /api/products` — Browse products
- `POST /api/orders` — Create order

## Default Seed Credentials

Use the seeded default admin account after running `node server/scripts/seed.js`:

- Email: `admin@apex.com`
- Password: `adminpassword`

Also included by seed:

- Vendor: `vendor@apex.com` / `vendorpassword`
- Customer: `customer@apex.com` / `customerpassword`

## Notes

- Vendor registration starts with `pending_approval` status and requires admin approval.
- The app serves static frontend files from `public/` and exposes REST endpoints under `/api/`.
- Modify `MONGODB_URI` and SMTP settings in `.env` for your environment.

## License

This project is released under the ISC License.
