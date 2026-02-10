# 🚀 Quick Start Guide

Get the Skill Enhancement Platform up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js installed (v14+)
- [ ] MongoDB installed OR MongoDB Atlas account
- [ ] npm or yarn installed

## Step-by-Step Setup

### 1. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd skill-enhancement-platform

# Or extract the downloaded folder
```

### 2. Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
# Copy .env.example to .env and edit it
# Windows: copy .env.example .env
# Mac/Linux: cp .env.example .env

# Edit .env file with your MongoDB URI
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/skill-enhancement

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skill-enhancement

# Seed the database (creates sample data)
npm run seed

# Start the server
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup (Terminal 2)

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
# App opens at http://localhost:3000
```

### 4. Access the Application

1. Open browser: `http://localhost:3000`
2. Register a new account OR use admin credentials:
   - **Email**: `admin@skillenhancement.com`
   - **Password**: `admin123`

### 5. Test the Application

1. **Login** with admin credentials
2. **Select a category** (Children/Students/Senior Citizens)
3. **Choose a skill** from the cards
4. **View resources** and click to open external links
5. **Bookmark** resources (requires login)
6. **Access Admin Panel** (admin only) to manage content

## Troubleshooting

### MongoDB Connection Issues

**Problem**: "MongoDB connection error"

**Solutions**:
- Ensure MongoDB is running locally: `mongod` or check MongoDB service
- For MongoDB Atlas: Check connection string and IP whitelist
- Verify `MONGODB_URI` in `.env` file

### Port Already in Use

**Problem**: "Port 5000 already in use"

**Solution**: Change PORT in backend `.env` file:
```env
PORT=5001
```
Then update frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

### CORS Errors

**Problem**: "CORS policy blocked"

**Solution**: Ensure backend is running and `REACT_APP_API_URL` in frontend `.env` matches backend URL

### Module Not Found

**Problem**: "Cannot find module"

**Solution**: 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Default Admin Account

After running `npm run seed`:
- **Email**: `admin@skillenhancement.com`
- **Password**: `admin123`
- **Role**: Admin (can access admin panel)

## Next Steps

1. **Customize Content**: Use Admin Panel to add your own skills and resources
2. **Update Resources**: Add verified YouTube playlists and course links
3. **Deploy**: Follow deployment guide in README.md
4. **Integrate Google OAuth**: Add Google OAuth SDK for full Google login support

## Development Commands

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)
npm run seed       # Seed database
```

### Frontend
```bash
npm start          # Start dev server
npm run build      # Build for production
```

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review [WIREFRAMES.md](WIREFRAMES.md) for UI specifications
- Check API endpoints in README.md API Documentation section

---

**Happy Learning! 🎓**
