const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  type: {
    type: String,
    enum: {
      values: ['youtube', 'udemy', 'coursera', 'edx', 'linkedin-learning', 'pluralsight', 'skillshare', 'khan-academy', 'freecodecamp', 'codecademy', 'udacity', 'medium', 'blog', 'documentation', 'github', 'podcast', 'book', 'article', 'video', 'interactive', 'other'],
      message: '{VALUE} is not a supported resource type'
    },
    required: [true, 'Resource type is required']
  },
  // Icon configuration for each resource type
  icon: {
    name: {
      type: String,
      default: function() {
        const iconMap = {
          'youtube': 'Youtube',
          'udemy': 'GraduationCap',
          'coursera': 'Award',
          'edx': 'BookOpen',
          'linkedin-learning': 'Linkedin',
          'pluralsight': 'Code',
          'skillshare': 'Palette',
          'khan-academy': 'School',
          'freecodecamp': 'Terminal',
          'codecademy': 'Code2',
          'udacity': 'Rocket',
          'medium': 'FileText',
          'blog': 'Newspaper',
          'documentation': 'Book',
          'github': 'Github',
          'podcast': 'Mic',
          'book': 'BookOpen',
          'article': 'FileText',
          'video': 'Video',
          'interactive': 'MousePointer',
          'other': 'Link'
        };
        return iconMap[this.type] || 'Link';
      }
    },
    color: {
      type: String,
      default: function() {
        const colorMap = {
          'youtube': '#FF0000',
          'udemy': '#A435F0',
          'coursera': '#0056D2',
          'edx': '#02262B',
          'linkedin-learning': '#0A66C2',
          'pluralsight': '#F15B2A',
          'skillshare': '#00FF84',
          'khan-academy': '#14BF96',
          'freecodecamp': '#0A0A23',
          'codecademy': '#1F4056',
          'udacity': '#02B3E4',
          'medium': '#000000',
          'blog': '#6366F1',
          'documentation': '#8B5CF6',
          'github': '#181717',
          'podcast': '#8B5CF6',
          'book': '#F59E0B',
          'article': '#10B981',
          'video': '#EF4444',
          'interactive': '#EC4899',
          'other': '#6B7280'
        };
        return colorMap[this.type] || '#6B7280';
      }
    },
    backgroundColor: {
      type: String,
      default: function() {
        const bgColorMap = {
          'youtube': '#FFE5E5',
          'udemy': '#F3E8FF',
          'coursera': '#E0F2FE',
          'edx': '#E0F2F1',
          'linkedin-learning': '#DBEAFE',
          'pluralsight': '#FEE2E2',
          'skillshare': '#D1FAE5',
          'khan-academy': '#D1FAE5',
          'freecodecamp': '#E0E7FF',
          'codecademy': '#DBEAFE',
          'udacity': '#CFFAFE',
          'medium': '#F3F4F6',
          'blog': '#E0E7FF',
          'documentation': '#F3E8FF',
          'github': '#F3F4F6',
          'podcast': '#F3E8FF',
          'book': '#FEF3C7',
          'article': '#D1FAE5',
          'video': '#FEE2E2',
          'interactive': '#FCE7F3',
          'other': '#F3F4F6'
        };
        return bgColorMap[this.type] || '#F3F4F6';
      }
    }
  },
  learningType: {
    type: String,
    enum: {
      values: ['free', 'premium', 'freemium'],
      message: '{VALUE} is not a valid learning type'
    },
    required: [true, 'Learning type is required']
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill reference is required'],
    index: true
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
  level: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced', 'expert', 'all-levels'],
      message: '{VALUE} is not a valid difficulty level'
    },
    default: 'beginner',
    index: true
  },
  thumbnail: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid thumbnail URL'
    }
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  creator: {
    type: String,
    default: 'Unknown',
    trim: true,
    maxlength: [100, 'Creator name cannot exceed 100 characters']
  },
  duration: {
    type: String,
    default: '',
    trim: true
  },
  // Enhanced duration in minutes for better filtering/sorting
  durationInMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  // Track number of ratings for weighted averages
  ratingsCount: {
    type: Number,
    min: 0,
    default: 0
  },
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Language of the resource
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  // Subtitles/Captions available
  subtitles: [{
    type: String,
    trim: true
  }],
  // Prerequisites
  prerequisites: [{
    type: String,
    trim: true
  }],
  // What you'll learn
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  // View/Click count
  viewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  // Enrollment count (for courses)
  enrollmentCount: {
    type: Number,
    min: 0,
    default: 0
  },
  // Completion rate
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Price information
  price: {
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    discountedAmount: {
      type: Number,
      min: 0
    }
  },
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
  // Who added this resource
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Last updated
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
resourceSchema.index({ skill: 1, category: 1, level: 1 });
resourceSchema.index({ type: 1, learningType: 1 });
resourceSchema.index({ verified: 1, isActive: 1 });
resourceSchema.index({ rating: -1, viewCount: -1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdAt: -1 });

// Virtual for formatted price
resourceSchema.virtual('formattedPrice').get(function() {
  if (this.learningType === 'free') return 'Free';
  if (this.price.discountedAmount !== undefined && this.price.discountedAmount < this.price.amount) {
    return `${this.price.currency} ${this.price.discountedAmount} (was ${this.price.amount})`;
  }
  return `${this.price.currency} ${this.price.amount}`;
});

// Virtual for icon details
resourceSchema.virtual('iconDetails').get(function() {
  return {
    name: this.icon.name,
    color: this.icon.color,
    backgroundColor: this.icon.backgroundColor,
    type: this.type
  };
});

// Pre-save middleware to update timestamps
resourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get resources by type with icons
resourceSchema.statics.getResourcesByType = function(type) {
  return this.find({ type, isActive: true, deletedAt: null })
    .populate('skill')
    .sort({ rating: -1, viewCount: -1 });
};

// Static method to get all resource types with their icons
resourceSchema.statics.getAllResourceTypes = function() {
  return [
    { type: 'youtube', icon: 'Youtube', color: '#FF0000', label: 'YouTube' },
    { type: 'udemy', icon: 'GraduationCap', color: '#A435F0', label: 'Udemy' },
    { type: 'coursera', icon: 'Award', color: '#0056D2', label: 'Coursera' },
    { type: 'edx', icon: 'BookOpen', color: '#02262B', label: 'edX' },
    { type: 'linkedin-learning', icon: 'Linkedin', color: '#0A66C2', label: 'LinkedIn Learning' },
    { type: 'pluralsight', icon: 'Code', color: '#F15B2A', label: 'Pluralsight' },
    { type: 'skillshare', icon: 'Palette', color: '#00FF84', label: 'Skillshare' },
    { type: 'khan-academy', icon: 'School', color: '#14BF96', label: 'Khan Academy' },
    { type: 'freecodecamp', icon: 'Terminal', color: '#0A0A23', label: 'freeCodeCamp' },
    { type: 'codecademy', icon: 'Code2', color: '#1F4056', label: 'Codecademy' },
    { type: 'udacity', icon: 'Rocket', color: '#02B3E4', label: 'Udacity' },
    { type: 'medium', icon: 'FileText', color: '#000000', label: 'Medium' },
    { type: 'blog', icon: 'Newspaper', color: '#6366F1', label: 'Blog' },
    { type: 'documentation', icon: 'Book', color: '#8B5CF6', label: 'Documentation' },
    { type: 'github', icon: 'Github', color: '#181717', label: 'GitHub' },
    { type: 'podcast', icon: 'Mic', color: '#8B5CF6', label: 'Podcast' },
    { type: 'book', icon: 'BookOpen', color: '#F59E0B', label: 'Book' },
    { type: 'article', icon: 'FileText', color: '#10B981', label: 'Article' },
    { type: 'video', icon: 'Video', color: '#EF4444', label: 'Video' },
    { type: 'interactive', icon: 'MousePointer', color: '#EC4899', label: 'Interactive' },
    { type: 'other', icon: 'Link', color: '#6B7280', label: 'Other' }
  ];
};

// Instance method to increment view count
resourceSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to update rating
resourceSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating * this.ratingsCount + newRating;
  this.ratingsCount += 1;
  this.rating = totalRating / this.ratingsCount;
  return this.save();
};

module.exports = mongoose.model('Resource', resourceSchema);