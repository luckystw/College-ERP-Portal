# DPG Institute of Technology and Management

A comprehensive web-based management system for educational institutions, built with modern technologies to handle student, teacher, and administrative operations efficiently.

## 🎓 Overview

DPG Institute of Technology and Management is a full-stack web application designed to streamline educational institution management. The system provides role-based access for administrators, teachers, and students with comprehensive features for attendance tracking, result management, course administration, and performance analytics.

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-role login system** (Admin, Teacher, Student)
- **JWT-based authentication** with secure token management
- **Role-based access control** with protected routes
- **Session management** with automatic logout

### 👨‍💼 Admin Dashboard
- **User Management**: Add, edit, and manage students and teachers
- **Course Management**: Create and manage academic courses
- **Subject Management**: Organize subjects within courses
- **Session Management**: Manage academic sessions and semesters
- **Attendance Overview**: View and analyze attendance patterns
- **Performance Analytics**: Comprehensive reporting and analytics
- **System Administration**: Full system control and configuration

### 👨‍🏫 Teacher Dashboard
- **Student Management**: View and manage assigned students
- **Attendance Management**: Mark and track student attendance
- **Result Management**: Enter and manage student results
- **Subject Overview**: View assigned subjects and courses
- **Performance Tracking**: Monitor student progress

### 👨‍🎓 Student Dashboard
- **Attendance View**: Check personal attendance records
- **Result View**: Access academic results and grades
- **Subject Overview**: View enrolled subjects and courses
- **Performance Analytics**: Track academic progress

### 📊 Analytics & Reporting
- **Real-time dashboards** with key metrics
- **Attendance analytics** with percentage calculations
- **Performance tracking** with visual charts
- **Export capabilities** for reports
- **Historical data** analysis

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Frontend
- **React.js** - User interface library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Chart.js** - Data visualization
- **Lucide React** - Icon library

### Development Tools
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands
- **ESLint** - Code linting

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MongoDB** (v4.0 or higher)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SAMS
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dpg_institute
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Start MongoDB service
mongod --dbpath C:\data\db

# Initialize database with sample data
npm run init-db
```

### 5. Start the Application
```bash
# Development mode (runs both backend and frontend)
npm run dev-full

# Or run separately:
# Backend only
npm run dev

# Frontend only
npm run client
```

## 🔑 Default Login Credentials

The system comes with pre-configured test accounts:

### Admin Account
- **Username:** `admin`
- **Password:** `password123`
- **Email:** `admin@dpg.edu`

### Teacher Account
- **Username:** `teacher`
- **Password:** `password123`
- **Email:** `teacher@dpg.edu`

### Student Account
- **Username:** `student`
- **Password:** `password123`
- **Email:** `student@dpg.edu`

## 📁 Project Structure

```
SAMS/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── admin/      # Admin dashboard components
│   │   │   ├── teacher/    # Teacher dashboard components
│   │   │   ├── student/    # Student dashboard components
│   │   │   ├── auth/       # Authentication components
│   │   │   └── common/     # Shared components
│   │   ├── contexts/       # React contexts
│   │   └── index.js        # Entry point
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # API routes
├── middleware/             # Custom middleware
├── config/                 # Configuration files
├── utils/                  # Utility functions
├── scripts/                # Database scripts
├── server.js              # Express server
└── package.json
```

## 🔧 Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database with sample data

### Frontend Scripts
- `npm run client` - Start React development server
- `npm run build` - Build production version
- `npm run test` - Run tests

### Combined Scripts
- `npm run dev-full` - Run both backend and frontend in development
- `npm run setup` - Complete setup (install + init-db)
- `npm run audit` - Security audit
- `npm run audit-fix` - Fix security vulnerabilities

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Helmet.js** for security headers
- **MongoDB Sanitization** to prevent NoSQL injection
- **HTTP Parameter Pollution** prevention

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Course Management
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Attendance Management
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `GET /api/attendance/summary` - Attendance summary

### Results Management
- `GET /api/results` - Get results
- `POST /api/results` - Add new result
- `PUT /api/results/:id` - Update result
- `GET /api/results/summary` - Results summary

## 🎨 UI/UX Features

- **Responsive Design** - Works on all devices
- **Modern Interface** - Clean and professional design
- **Dark/Light Mode** - User preference support
- **Interactive Charts** - Data visualization
- **Real-time Updates** - Live data synchronization
- **Loading States** - Smooth user experience
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success/error feedback

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
