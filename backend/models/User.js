const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
      },
      message: 'Please enter a valid email address'
    },
    index: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId; // Password not required if using OAuth
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  // OAuth providers
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  // Profile information
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: ''
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: 'Please enter a valid website URL'
      },
      default: ''
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(v);
        },
        message: 'Please enter a valid phone number'
      }
    }
  },
  category: {
    type: String,
    enum: {
      values: ['children', 'students', 'senior_citizens', 'professionals', 'all'],
      message: '{VALUE} is not a valid category'
    },
    default: 'students',
    index: true
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator', 'instructor'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user',
    index: true
  },
  // Bookmarks with additional metadata
  bookmarks: [{
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 500
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  // Learning progress
  learningProgress: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    completedResources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }],
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  // Achievements and gamification
  achievements: [{
    type: {
      type: String,
      enum: ['first_bookmark', 'completed_course', 'streak_7days', 'streak_30days', 'resource_contributor', 'skill_master'],
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  // Learning preferences
  preferences: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
      default: 'mixed'
    },
    preferredLanguages: [{
      type: String,
      default: ['English']
    }],
    emailNotifications: {
      newResources: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    displayDensity: {
      type: String,
      enum: ['comfortable', 'compact'],
      default: 'comfortable'
    }
  },
  // Activity tracking
  activity: {
    lastLogin: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0
    },
    resourcesViewed: {
      type: Number,
      default: 0
    },
    resourcesCompleted: {
      type: Number,
      default: 0
    }
  },
  // Security features
  security: {
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    emailVerificationToken: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      select: false
    }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedUntil: {
    type: Date
  },
  banReason: {
    type: String
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.passwordResetToken;
      delete ret.security.emailVerificationToken;
      delete ret.security.twoFactorSecret;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ category: 1, isActive: 1 });
userSchema.index({ 'activity.lastLogin': -1 });
userSchema.index({ points: -1, level: -1 });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual for bookmark count
userSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks ? this.bookmarks.length : 0;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  const ageInMs = Date.now() - this.createdAt.getTime();
  return Math.floor(ageInMs / (1000 * 60 * 60 * 24)); // days
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Don't hash if password is empty (OAuth users)
  if (!this.password) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    
    // Update passwordChangedAt
    if (!this.isNew) {
      this.security.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after password change
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.security.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.security.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.security.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};

// Instance method to add bookmark
userSchema.methods.addBookmark = async function(resourceId, notes = '') {
  const exists = this.bookmarks.find(
    b => b.resource && b.resource.toString() === resourceId.toString()
  );
  
  if (!exists) {
    this.bookmarks.push({
      resource: resourceId,
      addedAt: Date.now(),
      notes: notes
    });
    await this.save();
  }
  return this;
};

// Instance method to remove bookmark
userSchema.methods.removeBookmark = async function(resourceId) {
  this.bookmarks = this.bookmarks.filter(
    b => b.resource && b.resource.toString() !== resourceId.toString()
  );
  await this.save();
  return this;
};

// Instance method to update bookmark progress
userSchema.methods.updateBookmarkProgress = async function(resourceId, progress) {
  const bookmark = this.bookmarks.find(
    b => b.resource && b.resource.toString() === resourceId.toString()
  );
  
  if (bookmark) {
    bookmark.progress = Math.min(100, Math.max(0, progress));
    await this.save();
  }
  return this;
};

// Instance method to add achievement
userSchema.methods.addAchievement = async function(type, metadata = {}) {
  const exists = this.achievements.find(a => a.type === type);
  
  if (!exists) {
    this.achievements.push({
      type,
      earnedAt: Date.now(),
      metadata
    });
    
    // Award points based on achievement type
    const pointsMap = {
      'first_bookmark': 10,
      'completed_course': 50,
      'streak_7days': 100,
      'streak_30days': 500,
      'resource_contributor': 200,
      'skill_master': 300
    };
    
    this.points += pointsMap[type] || 0;
    
    // Update level based on points (every 1000 points = 1 level)
    this.level = Math.floor(this.points / 1000) + 1;
    
    await this.save();
  }
  return this;
};

// Instance method to update login activity
userSchema.methods.updateLoginActivity = async function() {
  const now = new Date();
  const lastLogin = this.activity.lastLogin;
  
  // Update streak
  if (lastLogin) {
    const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);
    
    if (hoursSinceLastLogin < 48) { // Within 2 days
      this.activity.currentStreak += 1;
      if (this.activity.currentStreak > this.activity.longestStreak) {
        this.activity.longestStreak = this.activity.currentStreak;
      }
    } else {
      this.activity.currentStreak = 1;
    }
  } else {
    this.activity.currentStreak = 1;
  }
  
  this.activity.lastLogin = now;
  this.activity.loginCount += 1;
  
  // Check for streak achievements
  if (this.activity.currentStreak === 7) {
    await this.addAchievement('streak_7days');
  }
  if (this.activity.currentStreak === 30) {
    await this.addAchievement('streak_30days');
  }
  
  await this.save();
  return this;
};

// Instance method to increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 }
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock the account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.security.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + lockTime };
  }
  
  return await this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { 'security.loginAttempts': 0 },
    $unset: { 'security.lockUntil': 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    isActive: true, 
    deletedAt: null 
  }).select('+password');
};

// Static method to get user stats
userSchema.statics.getUserStats = async function(userId) {
  const user = await this.findById(userId)
    .populate('bookmarks.resource', 'title type rating')
    .populate('learningProgress.skill', 'name icon color');
  
  if (!user) return null;
  
  return {
    totalBookmarks: user.bookmarks.length,
    totalAchievements: user.achievements.length,
    currentStreak: user.activity.currentStreak,
    longestStreak: user.activity.longestStreak,
    points: user.points,
    level: user.level,
    skillsInProgress: user.learningProgress.length,
    completedResources: user.activity.resourcesCompleted
  };
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    deletedAt: null 
  })
  .select('name profile.avatar points level activity.currentStreak')
  .sort({ points: -1, level: -1 })
  .limit(limit);
};

module.exports = mongoose.model('User', userSchema);