# Hostel Management System

A full-stack MERN application for comprehensive hostel operations management.

## 🚀 Features

- **Room Management** – Add, edit, view rooms with real-time availability tracking
- **Resident Management** – Check-in/out, profile management, emergency contacts
- **Maintenance Requests** – Submit, track, and manage requests (Kanban board for staff)
- **Billing & Payments** – Invoice generation, payment recording, Razorpay integration
- **Financial Reports** – Revenue charts, occupancy rates, maintenance analytics
- **User Roles** – Admin, Staff, and Resident roles with scoped permissions
- **Notifications** – In-app + email notification system

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hostel.com | password123 |
| Staff | staff@hostel.com | password123 |
| Resident | arjun@example.com | password123 |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Payments**: Razorpay
- **Notifications**: Nodemailer

## ⚙️ Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/hostel-management.git
cd hostel-management

# Install backend deps
cd server && npm install && cd ..

# Install frontend deps  
cd client && npm install && cd ..
```

### 2. Configure Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, etc.
```

### 3. Seed Demo Data

```bash
cd server
node utils/seeder.js
```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

App runs at: http://localhost:5173

## 🌐 Deployment

- **Frontend** → Netlify (auto-detects `netlify.toml`)
- **Backend** → Render (uses `render.yaml`)
- **Database** → MongoDB Atlas (free M0 tier)

### Environment Variables for Production

**Render (Backend):**
- `MONGO_URI` – MongoDB Atlas connection string
- `JWT_SECRET` – Any long random string
- `CLIENT_URL` – Your Netlify frontend URL
- `NODE_ENV` – production

**Netlify (Frontend):**
- `VITE_API_URL` – Your Render backend URL + `/api`
