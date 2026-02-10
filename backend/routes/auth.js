const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Constants
const TOKEN_EXPIRY = '30d';
const MIN_PASSWORD_LENGTH = 8;
const VALID_CATEGORIES = ['children', 'students', 'senior_citizens'];

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`)
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateGoogleAuth = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('googleId')
    .notEmpty()
    .withMessage('Google ID is required'),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`)
];

// Helper functions
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  category: user.category,
  role: user.role,
  createdAt: user.createdAt
});

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  return null;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { name, email, password, category } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      category: category || 'students'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password (not Google-only account)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', validateGoogleAuth, async (req, res) => {
  try {
    // Check validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { name, email, googleId, category, picture } = req.body;

    // Find existing user
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      // Update Google ID and picture if not set
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (picture && (!user.picture || user.picture !== picture)) {
        user.picture = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create new user
      isNewUser = true;
      user = new User({
        name,
        email,
        googleId,
        category: category || 'students',
        picture
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again later.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh authentication token
// @access  Private
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a JWT system, logout is typically handled client-side
    // This endpoint can be used for logging or blacklisting tokens if needed
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;