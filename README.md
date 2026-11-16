# Unfazed – Therapist Practice Management SaaS

**Unfazed** is a full-stack SaaS platform designed to help therapists manage and grow their private practice through a single branded online presence.

The platform provides tools for managing clients, scheduling appointments, accepting payments, maintaining clinical notes, and monitoring practice performance — all from one dashboard.

##  Live Demo

- **Frontend:** https://unfazed-fnks.vercel.app
- **Backend API:** https://unfazed-ykl6.onrender.com
- **GitHub Repository:** https://github.com/Deepeshvaru/Unfazed

##  Project Objective

The objective of Unfazed is to simplify the day-to-day operations of independent therapists by providing an integrated platform for practice management.

Therapists can create their professional profile, share a personalized booking link with clients, manage appointments, maintain client records, and track their business activities.

##  Key Features

### 1. Therapist Authentication
- Therapist registration and login.
- Secure authentication using JWT.
- Protected therapist dashboard.

### 2. Therapist Dashboard
- Centralized dashboard for managing practice activities.
- Access to clients, appointments, notes, payments, and analytics.
- Therapist profile management.

### 3. Client Management
- Add and manage client information.
- Maintain client records.
- Access client-related details from the dashboard.

### 4. Appointment Scheduling
- Configure weekly availability.
- Create additional availability and blocked time slots.
- Display available appointment slots.
- Allow clients to book appointments through a public booking page.
- Manage and delete saved availability.

### 5. Client Portal
- Dedicated client-facing portal.
- View relevant appointment and payment information.
- Access available client services.

### 6. Clinical Notes
- Create and manage clinical notes.
- Use SOAP-style note templates.
- Maintain organized client session records.

### 7. Payments and Packages
- Razorpay payment gateway integration.
- Create and manage session packages.
- Process and verify payments.
- View payment history.
- Generate and download invoices.

### 8. Subscription Management
- Multiple subscription plans: Free, Pro, and Premium.
- Subscription plan management.
- Plan-based feature access through entitlement controls.

### 9. Analytics
- Track practice performance.
- View revenue-related information.
- Monitor important business statistics.

### 10. Notifications and Messaging
- Notification functionality for important platform updates.
- Messaging functionality for communication within the platform.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| API Communication | Axios, REST APIs |
| Payment Gateway | Razorpay |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git and GitHub |

##  System Architecture

Unfazed follows a client-server architecture.

1. **Frontend:** The React application provides the therapist dashboard and client-facing pages.
2. **Backend:** The Node.js and Express.js server handles API requests, authentication, business logic, and application operations.
3. **Database:** MongoDB Atlas stores therapist, client, appointment, payment, notes, and subscription information.
4. **Payment Integration:** Razorpay handles payment-related operations.
5. **Deployment:** The frontend is hosted on Vercel, while the backend is deployed on Render.

##  Project Structure

The project is divided into two main applications:

```text
Unfazed/
│
├── unfazed-frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── routes/
│       └── App.jsx
│
└── unfazed-backend/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   └── routes/
    ├── server.js
    └── package.json
```

##  Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Backend Setup

Open the backend directory:

```bash
cd unfazed-backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory and configure the required environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd unfazed-frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The application will be available at the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

##  Environment Variables

Never upload actual credentials, API secrets, database passwords, or private keys to GitHub.

Use `.env` files for local configuration and add them to `.gitignore`.

For deployment, configure the required environment variables through the respective hosting platforms.

##  Deployment

The application is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Live application: https://unfazed-fnks.vercel.app

##  Future Enhancements

Potential improvements for future versions include:

- Advanced analytics and reporting.
- Additional appointment management features.
- Enhanced client communication.
- More payment and subscription options.
- Further improvements to the therapist dashboard and user experience.

 Project Information

**Project Name:** Unfazed  
**Project Type:** Full-Stack SaaS Web Application  
**Domain:** Therapist Practice Management  
**Target Users:** Independent therapists and counselling professionals  
**Deployment:** Vercel, Render, and MongoDB Atlas

---

**Unfazed – Simplifying Private Practice Management for Therapists.**
