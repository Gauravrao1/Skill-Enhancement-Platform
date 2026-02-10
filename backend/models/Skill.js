const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['children', 'students', 'senior_citizens', 'professionals', 'all'],
      message: '{VALUE} is not a valid category'
    },
    required: [true, 'Category is required'],
    index: true
  },
  // Icon configuration with more flexibility
  icon: {
    type: {
      type: String,
      enum: ['emoji', 'lucide', 'custom'],
      default: 'lucide'
    },
    value: {
      type: String,
      default: 'BookOpen'
    },
    emoji: {
      type: String,
      default: '📚'
    }
  },
  color: {
    primary: {
      type: String,
      default: '#4CAF50',
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Please enter a valid hex color code'
      }
    },
    secondary: {
      type: String,
      default: '#E8F5E9',
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Please enter a valid hex color code'
      }
    },
    gradient: {
      type: String,
      default: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)'
    }
  },
  // Resource references (populated dynamically)
  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  // Difficulty levels available for this skill
  levels: [{
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  }],
  // Popular tags related to this skill
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Related skills
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  // Prerequisites
  prerequisites: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  }],
  // Statistics
  statistics: {
    totalResources: {
      type: Number,
      default: 0,
      min: 0
    },
    freeResources: {
      type: Number,
      default: 0,
      min: 0
    },
    premiumResources: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalLearners: {
      type: Number,
      default: 0,
      min: 0
    },
    popularityScore: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // SEO and metadata
  metadata: {
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  // Ordering/Priority
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  // Featured flag
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  },
  // Who created/manages this skill
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
skillSchema.index({ category: 1, isActive: 1 });
skillSchema.index({ isFeatured: 1, priority: -1 });
skillSchema.index({ 'statistics.popularityScore': -1 });
skillSchema.index({ tags: 1 });
skillSchema.index({ slug: 1 });

// Virtual for total resource count (alternative to statistics)
skillSchema.virtual('resourceCount').get(function() {
  return this.resources ? this.resources.length : 0;
});

// Virtual for display icon (returns the appropriate icon based on type)
skillSchema.virtual('displayIcon').get(function() {
  if (this.icon.type === 'emoji') {
    return this.icon.emoji;
  } else if (this.icon.type === 'lucide') {
    return this.icon.value;
  } else {
    return this.icon.value; // custom icon identifier
  }
});

// Virtual to get active resources only
skillSchema.virtual('activeResources', {
  ref: 'Resource',
  localField: '_id',
  foreignField: 'skill',
  match: { isActive: true, deletedAt: null }
});

// Pre-save middleware to generate slug from name
skillSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to ensure default icon structure
skillSchema.pre('save', function(next) {
  if (!this.icon || typeof this.icon === 'string') {
    // Handle migration from old string-based icon
    const oldIcon = this.icon || '📚';
    this.icon = {
      type: 'emoji',
      value: 'BookOpen',
      emoji: oldIcon
    };
  }
  next();
});

// Pre-save middleware to ensure default color structure
skillSchema.pre('save', function(next) {
  if (!this.color || typeof this.color === 'string') {
    // Handle migration from old string-based color
    const oldColor = this.color || '#4CAF50';
    this.color = {
      primary: oldColor,
      secondary: this.lightenColor(oldColor, 40),
      gradient: `linear-gradient(135deg, ${oldColor} 0%, ${this.lightenColor(oldColor, 20)} 100%)`
    };
  }
  next();
});

// Helper method to lighten colors
skillSchema.methods.lightenColor = function(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
};

// Static method to get skills by category
skillSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true, 
    deletedAt: null 
  })
  .populate({
    path: 'resources',
    match: { isActive: true, deletedAt: null },
    select: 'title type learningType rating level'
  })
  .sort({ priority: -1, 'statistics.popularityScore': -1 });
};

// Static method to get featured skills
skillSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    isActive: true, 
    deletedAt: null 
  })
  .limit(limit)
  .sort({ priority: -1 })
  .populate({
    path: 'resources',
    match: { isActive: true, verified: true },
    options: { limit: 5, sort: { rating: -1 } }
  });
};

// Static method to search skills
skillSchema.statics.searchSkills = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ],
    isActive: true,
    deletedAt: null
  });
};

// Instance method to update statistics
skillSchema.methods.updateStatistics = async function() {
  const Resource = mongoose.model('Resource');
  
  // Only count verified and active resources
  const resources = await Resource.find({ 
    skill: this._id, 
    isActive: true,
    verified: true,
    deletedAt: null 
  });
  
  this.statistics.totalResources = resources.length;
  this.statistics.freeResources = resources.filter(r => r.learningType === 'free').length;
  this.statistics.premiumResources = resources.filter(r => r.learningType === 'premium').length;
  
  if (resources.length > 0) {
    const totalRating = resources.reduce((sum, r) => sum + r.rating, 0);
    this.statistics.averageRating = totalRating / resources.length;
    
    const totalEnrollments = resources.reduce((sum, r) => sum + (r.enrollmentCount || 0), 0);
    this.statistics.totalLearners = totalEnrollments;
    
    // Calculate popularity score based on resources, ratings, and learners
    this.statistics.popularityScore = 
      (resources.length * 10) + 
      (this.statistics.averageRating * 20) + 
      (totalEnrollments / 100);
  }
  
  return this.save();
};

// Instance method to add resource
skillSchema.methods.addResource = async function(resourceId) {
  if (!this.resources.includes(resourceId)) {
    this.resources.push(resourceId);
    await this.save();
    await this.updateStatistics();
  }
  return this;
};

// Instance method to remove resource
skillSchema.methods.removeResource = async function(resourceId) {
  this.resources = this.resources.filter(id => !id.equals(resourceId));
  await this.save();
  await this.updateStatistics();
  return this;
};

// Post-remove middleware to clean up resources
skillSchema.post('remove', async function(doc) {
  const Resource = mongoose.model('Resource');
  await Resource.updateMany(
    { skill: doc._id },
    { $set: { isActive: false } }
  );
});

module.exports = mongoose.model('Skill', skillSchema);