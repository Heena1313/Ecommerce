# Apex E-Commerce 🛍️

A modern multi-role marketplace built with **Node.js**, **Express**, and **MongoDB**. The platform supports three user personas: **admin**, **vendor**, and **customer**.

## 🚀 Features

### 👤 For Administrators

- **Admin Dashboard:** Review vendors, customers, and approval queue.
- **Vendor Management:** Approve, suspend, and manage vendor account status.
- **Customer Listing:** Browse registered customers and their account status.
- **Role-based API:** Secure admin endpoints using JWT and middleware checks.

### 🏬 For Vendors

- **Store Management:** Each vendor has a dedicated store and product listing.
- **Product CRUD:** Add, edit, and manage inventory for products.
- **Order Tracking:** View vendor-specific order details and customer purchase activity.
- **Pending Approval:** Vendor accounts are created pending admin approval for security.

### 👥 For Customers

- **Product Browsing:** Search and view products across active vendor stores.
- **Checkout Flow:** Create orders and process payments via PayPal.
- **Order History:** Track order status and view purchase history.
- **Reviews:** Leave reviews for purchased products.

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcryptjs
- **Payments:** PayPal integration
- **Frontend:** HTML5, CSS3, JavaScript
- **Utilities:** dotenv, cors, nodemailer

## 📁 Project Structure

- `server/`
  - `config/` — app and MongoDB configuration
  - `middleware/` — authentication and role authorization
  - `models/` — user, store, product, order, review schemas
  - `routes/` — API route handlers for auth, admin, stores, products, orders, reviews
  - `scripts/seed.js` — seed script for default users and sample data
  - `utils/` — email helper for password reset workflows
- `public/` — frontend assets
  - `js/` — client-side application logic
  - `css/` — styles
  - `index.html` — single-page entry point
- `docker-compose.yml` — Docker configuration if using containers

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/Heena1313/Ecommerce.git
cd project03
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with:

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

4. Seed the database:

```bash
node server/scripts/seed.js
```

5. Start the server:

```bash
npm start
```

Open the app at:

- `http://localhost:3000`

## 🔑 Default Accounts

- **Admin:** `admin@apex.com` / `adminpassword`
- **Vendor:** `vendor@apex.com` / `vendorpassword`
- **Customer:** `customer@apex.com` / `customerpassword`

## 🔧 Notes

- Vendor signups are created with `pending_approval` status and require admin approval.
- The frontend is served from `public/` while API routes are mounted under `/api/`.
- Use `JWT_SECRET` to control token security and `MONGODB_URI` for the database connection.

## 📝 Roadmap

- Add product search and category filtering
- Improve admin analytics with charts and stats
- Add order cancellation and refund flows
- Implement file uploads for product images and vendor banners

## 📜 License

ISC License.
