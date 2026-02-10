# 🎓 Skill Enhancement Platform

A comprehensive learning platform that helps Children, Students, and Senior Citizens enhance their skills by redirecting them to authentic learning resources (YouTube for free learning and best paid courses for premium learning).

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [Deployment Guide](#-deployment-guide)
- [Wireframes](#-wireframes)
- [Sample Data](#-sample-data)

## ✨ Features

### Core Features
- **User Authentication**: Email/Password and Google OAuth support
- **Category-Based Learning**: Three distinct categories (Children, Students, Senior Citizens)
- **Skill Cards**: Visual, interactive skill selection
- **Resource Curation**: Verified YouTube playlists and premium course links
- **Bookmarking System**: Save favorite resources for later
- **Search Functionality**: Find skills quickly
- **Admin Panel**: Manage skills and resources
- **Responsive Design**: Works on all devices

### Category-Specific Features

#### 👶 Children Section
- Colorful, child-friendly UI
- Large fonts and icons
- Only free YouTube resources
- Skills: Story Telling, Drawing & Coloring, Rhymes & Music, Basic Maths, Brain Games

#### 🎓 Students Section
- Free and Premium learning options
- Verified creators only
- Industry-recognized certificates for premium courses
- Skills: Computer Science, Web Development, AI/ML, Data Analytics, Soft Skills, Finance & Business

#### 👴 Senior Citizens Section
- Simple, accessible UI
- Large text and clear navigation
- Mostly free resources
- Skills: Digital Newspaper Reading, Smartphone Basics, Online Banking Awareness, Health & Yoga, Music/Bhajans

## 🛠 Tech Stack

### Frontend
- **React.js** 18.2.0
- **React Router DOM** 6.16.0
- **Axios** 1.5.0
- **React Icons** 4.11.0
- **CSS3** (Custom styling)

### Backend
- **Node.js**
- **Express.js** 4.18.2
- **MongoDB** with Mongoose 7.5.0
- **JWT** (JSON Web Tokens) for authentication
- **bcryptjs** 2.4.3 for password hashing
- **express-validator** 7.0.1

### Database
- **MongoDB** (NoSQL database)

## 📁 Project Structure

```
skill-enhancement-platform/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Skill.js         # Skill model
│   │   └── Resource.js      # Resource model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── skills.js        # Skills routes
│   │   ├── resources.js     # Resources routes
│   │   ├── bookmarks.js     # Bookmarks routes
│   │   └── admin.js         # Admin routes
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── scripts/
│   │   └── seedData.js      # Database seeding script
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CategoryPage.js
│   │   │   ├── SkillDetail.js
│   │   │   ├── Bookmarks.js
│   │   │   └── AdminPanel.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## 🗄 Database Schema

### User Collection
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (min 6 chars),
  googleId: String (optional),
  category: String (enum: ['children', 'students', 'senior_citizens']),
  role: String (enum: ['user', 'admin'], default: 'user'),
  bookmarks: [ObjectId] (references Resource),
  createdAt: Date
}
```

### Skill Collection
```javascript
{
  name: String (required),
  description: String,
  category: String (enum: ['children', 'students', 'senior_citizens']),
  icon: String (emoji),
  color: String (hex color),
  resources: [ObjectId] (references Resource),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### Resource Collection
```javascript
{
  title: String (required),
  description: String,
  url: String (required),
  type: String (enum: ['youtube', 'udemy', 'coursera', 'other']),
  learningType: String (enum: ['free', 'premium']),
  skill: ObjectId (references Skill),
  category: String (enum: ['children', 'students', 'senior_citizens']),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  thumbnail: String,
  verified: Boolean (default: false),
  creator: String,
  duration: String,
  rating: Number (0-5),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/skill-enhancement
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   - Local: Make sure MongoDB is running on your system
   - Atlas: Use your MongoDB Atlas connection string in `MONGODB_URI`

6. **Seed the database** (optional)
   ```bash
   npm run seed
   ```
   This creates sample skills, resources, and an admin user:
   - Email: `admin@skillenhancement.com`
   - Password: `admin123`

7. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

   The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   Create `.env` file in frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

### Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or use the admin credentials:
   - Email: `admin@skillenhancement.com`
   - Password: `admin123`

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "category": "students"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/google`
Google OAuth login
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "googleId": "google-id-here",
  "category": "students"
}
```

#### GET `/api/auth/me`
Get current user (requires authentication)

### Skills Endpoints

#### GET `/api/skills`
Get all skills (optional query params: `category`, `search`)

#### GET `/api/skills/:id`
Get single skill with resources

#### GET `/api/skills/:id/resources`
Get resources for a skill (optional query params: `learningType`, `level`)

### Resources Endpoints

#### GET `/api/resources`
Get all resources (optional query params: `category`, `learningType`, `type`, `skill`, `search`)

#### GET `/api/resources/:id`
Get single resource

### Bookmarks Endpoints (Requires Authentication)

#### GET `/api/bookmarks`
Get user's bookmarks

#### POST `/api/bookmarks/:resourceId`
Add resource to bookmarks

#### DELETE `/api/bookmarks/:resourceId`
Remove resource from bookmarks

### Admin Endpoints (Requires Admin Role)

#### POST `/api/admin/skills`
Create a new skill

#### PUT `/api/admin/skills/:id`
Update a skill

#### DELETE `/api/admin/skills/:id`
Delete a skill (soft delete)

#### POST `/api/admin/resources`
Create a new resource

#### PUT `/api/admin/resources/:id`
Update a resource

#### DELETE `/api/admin/resources/:id`
Delete a resource (soft delete)

## 🚢 Deployment Guide

### Backend Deployment (Heroku Example)

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Frontend Deployment (Vercel/Netlify Example)

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory
3. Run `vercel`
4. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.com/api`

#### Netlify
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Set environment variable in Netlify dashboard

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist your IP address
5. Get connection string and use it in `MONGODB_URI`

## 🎨 Wireframes

### Page Flow
1. **Login/Register** → Authentication
2. **Dashboard** → Category Selection (Children/Students/Senior Citizens)
3. **Category Page** → Skill Cards with Search
4. **Skill Detail** → Resource List (Free/Premium options for Students)
5. **Bookmarks** → Saved Resources
6. **Admin Panel** → Manage Skills & Resources

### Design Principles
- **Children**: Large fonts, colorful cards, playful icons
- **Students**: Modern, clean, professional
- **Senior Citizens**: Simple, large text, clear navigation

## 📊 Sample Data

The seed script creates:

### Skills
- **Children**: Story Telling, Drawing & Coloring, Rhymes & Music, Basic Maths, Brain Games
- **Students**: Computer Science, Web Development, AI/ML, Data Analytics, Soft Skills, Finance & Business
- **Senior Citizens**: Digital Newspaper Reading, Smartphone Basics, Online Banking Awareness, Health & Yoga, Music/Bhajans

### Resources
- Sample YouTube playlists (free)
- Sample Udemy/Coursera courses (premium)
- All resources are linked to appropriate skills

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes (frontend & backend)
- Admin role-based access control
- Input validation
- CORS configuration

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`
   - Verify network access for MongoDB Atlas

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Or kill the process using the port

3. **CORS Errors**
   - Ensure backend CORS is configured
   - Check `REACT_APP_API_URL` in frontend `.env`

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET matches in backend

## 📝 License

This project is open source and available for educational purposes.

## 👥 Team
Gaurav Rao
Rashi Gupta
Ayush Raj Sinha
Shashank Awasthi
## Author
 Gaurav Rao
---

**Built with ❤️ for learning and skill enhancement**
