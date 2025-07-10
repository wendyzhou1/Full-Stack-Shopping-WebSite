# TUT3-G2-ASS2 readme

# OldPhoneDeals - eCommerce Web Application (COMP5347/COMP4347 Assignment 2)

This project is a full-stack MEAN (MongoDB, Express.js, Angular, Node.js) eCommerce platform for buying and selling used phones. It includes both user and admin interfaces with features such as authentication, product listing, reviews, and transaction logging.

## Tech Stack

- Frontend: Angular
- Backend: Node.js + Express.js
- Database: MongoDB
- Authentication: JWT, bcrypt, email verification
- Admin Tools: Audit log, user/listing moderation

## Prerequisites
This guide explains how to manually import the provided files into a MongoDB database.
1. Install the following tools:
   - [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) (includes `mongoimport`)
2. Ensure the MongoDB service is running (default port: `27017`).
3. - **`./backend/app/server/data/OldPhoneDeals.products.json`**  
  Contains product data in JSON format (one document per line or as a JSON array).
   - **`./backend/app/server/data/OldPhoneDeals.users.json`**  
  Contains user data in JSON format (one document per line or as a JSON array).
  - Import the above two files into mongoDB according to their names.
 4. - **`./backend/scripts/updateProducts.js`**: Adjusts product data structure to match the latest schema.  
    - **`./backend/scripts/updateUsers.js`**: Modifies user records to align with model validations. 
    - **`./backend/scripts/updatePassword.js`**: Updates password fields to comply with security policies.  
- If the database format is inconsistent with these two json files, please run the above three files in sequence. 

## Backend Setup

```bash
cd backend
npm install
npm start
```

Runs at: http://localhost:3000

---

## Frontend Setup

```bash
cd frontend
npm install
ng serve
```

Runs at: http://localhost:4200


## Modules Overview
### 1. Product Module
- **Controllers**: `controllers/product.controller.js`  
  Handles product-related business logic (CRUD operations, inventory management).  
- **Models**: 
  - `models/product.model.js`: Defines product schema (name, price...).  
  - `models/sales.model.js`: Records transaction details (order ID, amount, timestamp...).  
- **Routes**: `routes/product.routes.js`  

---

### 2. Authentication & Authorization (Auth) Module
- **Controllers**: `controllers/auth.controller.js`  
  Implements user registration, login, logout, and password reset workflows.  
- **Models**:  
  - `models/user.model.js`: Stores verified user data.  
  - `models/TempUser.model.js`: Stores unverified user data (pending email confirmation).  
- **Middleware**: `middleware/authMiddleware.js`  
  Validates JWT tokens and ensures user authentication.  
- **Routes**: `routes/auth.routes.js`  
- **Email Utility**: `utils/email.js`  
  Sends verification/password reset emails.  

---

### 3. Admin Module
- **Controllers**: `controllers/admin.controller.js`  
  Implements admin actions (user bans, product audits).  
- **Models**:  
  - `models/adminlog.model.js`: Tracks admin activities (action type, timestamp, IP).  
- **Middleware**:  
  - `middleware/adminAuth.js`: Validates admin privileges.  
  - `middleware/audit.service.js`: Logs critical operations to `data/audit_log.csv`.  
- **Data Files**:  
  - `data/audit_log.csv`: Raw audit logs (failed logins, admin actions).  
- **Routes**: `routes/admin.routes.js`  

---

### 4. Profile Module
- **Controllers**: `controllers/profile.controller.js`  
  Manages user profile operations (avatar, contact details).  
- **Routes**: `routes/profile.routes.js`   

---

### 5. User Module
- **Controllers**: `controllers/user.controller.js`  
  Manages user's operations (wishlist, cart, checkout).  
- **Routes**: `routes/user.routes.js`   

---

### Infrastructure & Configuration
- **Entry Points**:  
  - `server`: Main server configuration (Express setup, middleware binding).  
  - `app`: Application initialization and routing.  
- **Admin Initialization**: `utils/createAdmin.js`  
  Creates default admin account during deployment.  

## Admin Login

- URL: http://localhost:4200/admin
- Email: admin@oldphonedeals.com
- Password: AdminPass123!

Do not delete the super admin account.

## Features

### User

- Browse/search/filter listings
- Add to cart and wishlist
- Checkout and transaction flow
- Write, hide/show reviews
- Sign up/login/email verification/password reset
- Manage profile, listings, and comments

### Admin

- Login with session timeout
- View, edit, disable/delete users and listings
- Review moderation and visibility toggle
- View/export sales logs
- Audit logging

## Team Members

| Name         | SID        | Role                      |
|--------------|------------|---------------------------|
| Boyang Zhou  | 540224425  | User Interface Frontend, Database         |
| Yanxin Zhou   | 540070800  | Backend, Database        |
| Hao Fu      | 540224768  | Backend, Database            |
| Zhenya Wang   | 530282587  | Admin Interface, Frontend  |







