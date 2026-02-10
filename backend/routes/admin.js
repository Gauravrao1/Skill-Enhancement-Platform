const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { authenticate, isAdmin, isModerator } = require('../middleware/auth');
const { verifyUrl, isKnownAuthenticPlatform } = require('../utils/urlVerifier');

const router = express.Router();

// Validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// All admin routes require authentication
router.use(authenticate);

// ==================== SKILLS ROUTES ====================

// @route   GET /api/admin/skills
// @desc    Get all skills (including inactive)
// @access  Private/Admin/Moderator
router.get('/skills', 
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['children', 'students', 'senior_citizens', 'professionals', 'all']),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        isActive, 
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build query
      const query = {};
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Get skills with pagination
      const skills = await Skill.find(query)
        .populate({
          path: 'resources',
          select: 'title type learningType rating verified'
        })
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Skill.countDocuments(query);

      res.json({
        success: true,
        data: skills,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get skills error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch skills',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/admin/skills/:id
// @desc    Get single skill with full details
// @access  Private/Admin
router.get('/skills/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID')
  ],
  validate,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id)
        .populate({
          path: 'resources',
          populate: { path: 'skill', select: 'name' }
        })
        .populate('relatedSkills', 'name icon color')
        .populate('prerequisites.skill', 'name');

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      res.json({
        success: true,
        data: skill
      });
    } catch (error) {
      console.error('Get skill error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch skill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/admin/skills
// @desc    Create a new skill
// @access  Private/Admin
router.post('/skills', 
  isAdmin,
  [
    body('name')
      .notEmpty().withMessage('Skill name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('category')
      .isIn(['children', 'students', 'senior_citizens', 'professionals', 'all'])
      .withMessage('Invalid category'),
    body('icon.type')
      .optional()
      .isIn(['emoji', 'lucide', 'custom'])
      .withMessage('Invalid icon type'),
    body('icon.value')
      .optional()
      .isString()
      .trim(),
    body('icon.emoji')
      .optional()
      .isString()
      .trim(),
    body('color.primary')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Invalid primary color format'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('levels')
      .optional()
      .isArray()
      .withMessage('Levels must be an array'),
    body('priority')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Priority must be a non-negative integer'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean')
  ],
  validate,
  async (req, res) => {
    try {
      // Check if skill with same name already exists
      const existingSkill = await Skill.findOne({ 
        name: new RegExp(`^${req.body.name}$`, 'i'),
        deletedAt: null
      });

      if (existingSkill) {
        return res.status(400).json({ 
          success: false,
          message: 'A skill with this name already exists' 
        });
      }

      const skillData = {
        ...req.body,
        createdBy: req.user._id
      };

      const skill = new Skill(skillData);
      await skill.save();

      res.status(201).json({
        success: true,
        message: 'Skill created successfully',
        data: skill
      });
    } catch (error) {
      console.error('Create skill error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'A skill with this name already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Failed to create skill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/admin/skills/:id
// @desc    Update a skill
// @access  Private/Admin
router.put('/skills/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('category')
      .optional()
      .isIn(['children', 'students', 'senior_citizens', 'professionals', 'all'])
      .withMessage('Invalid category'),
    body('color.primary')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Invalid primary color format')
  ],
  validate,
  async (req, res) => {
    try {
      // Check if updating name to an existing one
      if (req.body.name) {
        const existingSkill = await Skill.findOne({ 
          name: new RegExp(`^${req.body.name}$`, 'i'),
          _id: { $ne: req.params.id },
          deletedAt: null
        });

        if (existingSkill) {
          return res.status(400).json({ 
            success: false,
            message: 'A skill with this name already exists' 
          });
        }
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      const skill = await Skill.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      // Update statistics
      await skill.updateStatistics();

      res.json({
        success: true,
        message: 'Skill updated successfully',
        data: skill
      });
    } catch (error) {
      console.error('Update skill error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update skill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PATCH /api/admin/skills/:id/toggle-active
// @desc    Toggle skill active status
// @access  Private/Admin
router.patch('/skills/:id/toggle-active',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID')
  ],
  validate,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      skill.isActive = !skill.isActive;
      skill.updatedBy = req.user._id;
      await skill.save();

      res.json({
        success: true,
        message: `Skill ${skill.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { isActive: skill.isActive }
      });
    } catch (error) {
      console.error('Toggle skill status error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to toggle skill status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/admin/skills/:id
// @desc    Delete a skill (soft delete)
// @access  Private/Admin
router.delete('/skills/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID')
  ],
  validate,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      // Check if skill has active resources
      const activeResourcesCount = await Resource.countDocuments({
        skill: skill._id,
        isActive: true,
        deletedAt: null
      });

      if (activeResourcesCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete skill with ${activeResourcesCount} active resources. Please deactivate or delete the resources first.`,
          data: { activeResourcesCount }
        });
      }

      skill.isActive = false;
      skill.deletedAt = new Date();
      skill.updatedBy = req.user._id;
      await skill.save();

      res.json({ 
        success: true,
        message: 'Skill deleted successfully' 
      });
    } catch (error) {
      console.error('Delete skill error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete skill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/admin/skills/:id/restore
// @desc    Restore a soft-deleted skill
// @access  Private/Admin
router.post('/skills/:id/restore',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID')
  ],
  validate,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      skill.isActive = true;
      skill.deletedAt = null;
      skill.updatedBy = req.user._id;
      await skill.save();

      res.json({
        success: true,
        message: 'Skill restored successfully',
        data: skill
      });
    } catch (error) {
      console.error('Restore skill error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to restore skill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/admin/skills/:id/update-statistics
// @desc    Manually update skill statistics
// @access  Private/Admin
router.post('/skills/:id/update-statistics',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid skill ID')
  ],
  validate,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      await skill.updateStatistics();

      res.json({
        success: true,
        message: 'Statistics updated successfully',
        data: skill.statistics
      });
    } catch (error) {
      console.error('Update statistics error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ==================== RESOURCES ROUTES ====================

// @route   GET /api/admin/resources
// @desc    Get all resources (including inactive)
// @access  Private/Admin/Moderator
router.get('/resources',
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skill').optional().isMongoId(),
    query('type').optional().isString(),
    query('learningType').optional().isIn(['free', 'premium', 'freemium']),
    query('category').optional().isString(),
    query('level').optional().isString(),
    query('verified').optional().isBoolean(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        skill,
        type,
        learningType,
        category,
        level,
        verified,
        isActive,
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      const query = {};
      if (skill) query.skill = skill;
      if (type) query.type = type;
      if (learningType) query.learningType = learningType;
      if (category) query.category = category;
      if (level) query.level = level;
      if (verified !== undefined) query.verified = verified === 'true';
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { creator: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const resources = await Resource.find(query)
        .populate('skill', 'name icon color category')
        .populate('addedBy', 'name email')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Resource.countDocuments(query);

      res.json({
        success: true,
        data: resources,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get resources error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch resources',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/admin/resources/:id
// @desc    Get single resource with full details
// @access  Private/Admin
router.get('/resources/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID')
  ],
  validate,
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id)
        .populate('skill', 'name icon color category')
        .populate('addedBy', 'name email');

      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      res.json({
        success: true,
        data: resource
      });
    } catch (error) {
      console.error('Get resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/admin/resources
// @desc    Create a new resource
// @access  Private/Admin
router.post('/resources',
  isAdmin,
  [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
      .trim(),
    body('url')
      .notEmpty().withMessage('URL is required')
      .isURL().withMessage('Valid URL is required')
      .trim(),
    body('type')
      .isIn(['youtube', 'udemy', 'coursera', 'edx', 'linkedin-learning', 'pluralsight', 'skillshare', 'khan-academy', 'freecodecamp', 'codecademy', 'udacity', 'medium', 'blog', 'documentation', 'github', 'podcast', 'book', 'article', 'video', 'interactive', 'other'])
      .withMessage('Invalid resource type'),
    body('learningType')
      .isIn(['free', 'premium', 'freemium'])
      .withMessage('Invalid learning type'),
    body('skill')
      .notEmpty().withMessage('Skill ID is required')
      .isMongoId().withMessage('Invalid skill ID'),
    body('category')
      .isIn(['children', 'students', 'senior_citizens', 'professionals', 'all'])
      .withMessage('Invalid category'),
    body('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert', 'all-levels'])
      .withMessage('Invalid difficulty level'),
    body('creator')
      .optional()
      .isLength({ max: 100 }).withMessage('Creator name cannot exceed 100 characters')
      .trim(),
    body('duration')
      .optional()
      .isString()
      .trim(),
    body('durationInMinutes')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration in minutes must be a non-negative integer'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    body('language')
      .optional()
      .isString()
      .trim(),
    body('price.amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price amount must be non-negative'),
    body('verified')
      .optional()
      .isBoolean().withMessage('Verified must be a boolean')
  ],
  validate,
  async (req, res) => {
    try {
      // Verify skill exists
      const skill = await Skill.findById(req.body.skill);
      if (!skill) {
        return res.status(404).json({ 
          success: false,
          message: 'Skill not found' 
        });
      }

      // Check for duplicate URL
      const existingResource = await Resource.findOne({ 
        url: req.body.url,
        deletedAt: null
      });

      if (existingResource) {
        return res.status(400).json({ 
          success: false,
          message: 'A resource with this URL already exists' 
        });
      }

      // Verify URL is accessible and working
      let verified = false;
      let verificationError = null;
      
      // Check if it's a known authentic platform (auto-verify)
      if (isKnownAuthenticPlatform(req.body.url)) {
        verified = true;
      } else {
        // Verify URL accessibility
        const verificationResult = await verifyUrl(req.body.url);
        if (verificationResult.isValid) {
          verified = true;
        } else {
          verificationError = verificationResult.error || 'URL verification failed';
          // Still allow creation but mark as unverified
          console.warn(`Resource URL verification failed: ${req.body.url} - ${verificationError}`);
        }
      }

      const resourceData = {
        ...req.body,
        addedBy: req.user._id,
        verified: verified || req.body.verified || false
      };

      const resource = new Resource(resourceData);
      await resource.save();

      // Add resource to skill using the instance method
      await skill.addResource(resource._id);

      res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: resource
      });
    } catch (error) {
      console.error('Create resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/admin/resources/:id
// @desc    Update a resource
// @access  Private/Admin
router.put('/resources/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID'),
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('url')
      .optional()
      .isURL().withMessage('Valid URL is required')
      .trim(),
    body('type')
      .optional()
      .isIn(['youtube', 'udemy', 'coursera', 'edx', 'linkedin-learning', 'pluralsight', 'skillshare', 'khan-academy', 'freecodecamp', 'codecademy', 'udacity', 'medium', 'blog', 'documentation', 'github', 'podcast', 'book', 'article', 'video', 'interactive', 'other'])
      .withMessage('Invalid resource type'),
    body('skill')
      .optional()
      .isMongoId().withMessage('Invalid skill ID'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5')
  ],
  validate,
  async (req, res) => {
    try {
      const oldResource = await Resource.findById(req.params.id);
      
      if (!oldResource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      // If URL is being changed, verify it
      if (req.body.url && req.body.url !== oldResource.url) {
        let verified = false;
        
        // Check if it's a known authentic platform
        if (isKnownAuthenticPlatform(req.body.url)) {
          verified = true;
        } else {
          // Verify URL accessibility
          const verificationResult = await verifyUrl(req.body.url);
          if (verificationResult.isValid) {
            verified = true;
          } else {
            console.warn(`Resource URL verification failed: ${req.body.url} - ${verificationResult.error}`);
            // If admin explicitly sets verified, respect that
            if (req.body.verified === undefined) {
              req.body.verified = false;
            }
          }
        }
        
        // Set verified status if not explicitly provided
        if (req.body.verified === undefined) {
          req.body.verified = verified;
        }
      }

      // If skill is being changed
      if (req.body.skill && req.body.skill !== oldResource.skill.toString()) {
        const newSkill = await Skill.findById(req.body.skill);
        if (!newSkill) {
          return res.status(404).json({ 
            success: false,
            message: 'New skill not found' 
          });
        }

        const oldSkill = await Skill.findById(oldResource.skill);
        
        // Remove from old skill
        if (oldSkill) {
          await oldSkill.removeResource(oldResource._id);
        }
        
        // Add to new skill
        await newSkill.addResource(oldResource._id);
      }

      const resource = await Resource.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('skill', 'name icon color');

      // Update skill statistics
      const skill = await Skill.findById(resource.skill);
      if (skill) {
        await skill.updateStatistics();
      }

      res.json({
        success: true,
        message: 'Resource updated successfully',
        data: resource
      });
    } catch (error) {
      console.error('Update resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PATCH /api/admin/resources/:id/verify
// @desc    Verify a resource URL and mark as verified
// @access  Private/Admin
router.patch('/resources/:id/verify',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID')
  ],
  validate,
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      // Verify URL is accessible
      let verified = false;
      let verificationError = null;
      
      // Check if it's a known authentic platform
      if (isKnownAuthenticPlatform(resource.url)) {
        verified = true;
      } else {
        // Verify URL accessibility
        const verificationResult = await verifyUrl(resource.url);
        if (verificationResult.isValid) {
          verified = true;
        } else {
          verificationError = verificationResult.error || 'URL verification failed';
        }
      }

      // Update resource with verification status
      resource.verified = verified;
      await resource.save();

      if (verified) {
        res.json({
          success: true,
          message: 'Resource verified successfully',
          data: resource
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Resource URL verification failed: ${verificationError}`,
          data: resource,
          verificationError
        });
      }
    } catch (error) {
      console.error('Verify resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to verify resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PATCH /api/admin/resources/:id/toggle-active
// @desc    Toggle resource active status
// @access  Private/Admin
router.patch('/resources/:id/toggle-active',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID')
  ],
  validate,
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      resource.isActive = !resource.isActive;
      await resource.save();

      // Update skill statistics
      const skill = await Skill.findById(resource.skill);
      if (skill) {
        await skill.updateStatistics();
      }

      res.json({
        success: true,
        message: `Resource ${resource.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { isActive: resource.isActive }
      });
    } catch (error) {
      console.error('Toggle resource status error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to toggle resource status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/admin/resources/:id
// @desc    Delete a resource (soft delete)
// @access  Private/Admin
router.delete('/resources/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID')
  ],
  validate,
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      resource.isActive = false;
      resource.deletedAt = new Date();
      await resource.save();

      // Remove from skill using instance method
      const skill = await Skill.findById(resource.skill);
      if (skill) {
        await skill.removeResource(resource._id);
      }

      res.json({ 
        success: true,
        message: 'Resource deleted successfully' 
      });
    } catch (error) {
      console.error('Delete resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/admin/resources/:id/restore
// @desc    Restore a soft-deleted resource
// @access  Private/Admin
router.post('/resources/:id/restore',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid resource ID')
  ],
  validate,
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found' 
        });
      }

      resource.isActive = true;
      resource.deletedAt = null;
      await resource.save();

      // Add back to skill
      const skill = await Skill.findById(resource.skill);
      if (skill) {
        await skill.addResource(resource._id);
      }

      res.json({
        success: true,
        message: 'Resource restored successfully',
        data: resource
      });
    } catch (error) {
      console.error('Restore resource error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to restore resource',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ==================== BULK OPERATIONS ====================

// @route   POST /api/admin/resources/bulk-verify
// @desc    Verify multiple resources
// @access  Private/Admin
router.post('/resources/bulk-verify',
  isAdmin,
  [
    body('resourceIds')
      .isArray({ min: 1 }).withMessage('resourceIds must be a non-empty array')
      .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)))
      .withMessage('All resourceIds must be valid MongoDB ObjectIds')
  ],
  validate,
  async (req, res) => {
    try {
      const { resourceIds } = req.body;

      const result = await Resource.updateMany(
        { _id: { $in: resourceIds } },
        { verified: true }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} resources verified successfully`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Bulk verify error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to verify resources',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/admin/resources/bulk-delete
// @desc    Delete multiple resources
// @access  Private/Admin
router.delete('/resources/bulk-delete',
  isAdmin,
  [
    body('resourceIds')
      .isArray({ min: 1 }).withMessage('resourceIds must be a non-empty array')
  ],
  validate,
  async (req, res) => {
    try {
      const { resourceIds } = req.body;

      const result = await Resource.updateMany(
        { _id: { $in: resourceIds } },
        { 
          isActive: false,
          deletedAt: new Date()
        }
      );

      // Update all affected skills
      const resources = await Resource.find({ _id: { $in: resourceIds } });
      const skillIds = [...new Set(resources.map(r => r.skill.toString()))];
      
      for (const skillId of skillIds) {
        const skill = await Skill.findById(skillId);
        if (skill) {
          await skill.updateStatistics();
        }
      }

      res.json({
        success: true,
        message: `${result.modifiedCount} resources deleted successfully`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete resources',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ==================== STATISTICS & ANALYTICS ====================

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats',
  isAdmin,
  async (req, res) => {
    try {
      const [
        totalSkills,
        activeSkills,
        totalResources,
        activeResources,
        verifiedResources,
        totalUsers,
        activeUsers
      ] = await Promise.all([
        Skill.countDocuments({ deletedAt: null }),
        Skill.countDocuments({ isActive: true, deletedAt: null }),
        Resource.countDocuments({ deletedAt: null }),
        Resource.countDocuments({ isActive: true, deletedAt: null }),
        Resource.countDocuments({ verified: true, isActive: true, deletedAt: null }),
        User.countDocuments({ deletedAt: null }),
        User.countDocuments({ isActive: true, deletedAt: null })
      ]);

      // Resource type distribution
      const resourcesByType = await Resource.aggregate([
        { $match: { isActive: true, deletedAt: null } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Resources by category
      const resourcesByCategory = await Resource.aggregate([
        { $match: { isActive: true, deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      // Free vs Premium
      const resourcesByLearningType = await Resource.aggregate([
        { $match: { isActive: true, deletedAt: null } },
        { $group: { _id: '$learningType', count: { $sum: 1 } } }
      ]);

      // Top rated resources
      const topRatedResources = await Resource.find({ 
        isActive: true, 
        deletedAt: null,
        rating: { $gt: 0 }
      })
      .sort({ rating: -1, ratingsCount: -1 })
      .limit(5)
      .select('title rating ratingsCount type')
      .populate('skill', 'name');

      // Most popular skills
      const popularSkills = await Skill.find({ 
        isActive: true, 
        deletedAt: null 
      })
      .sort({ 'statistics.popularityScore': -1 })
      .limit(5)
      .select('name statistics.totalResources statistics.averageRating statistics.totalLearners');

      res.json({
        success: true,
        data: {
          overview: {
            skills: {
              total: totalSkills,
              active: activeSkills,
              inactive: totalSkills - activeSkills
            },
            resources: {
              total: totalResources,
              active: activeResources,
              verified: verifiedResources,
              unverified: activeResources - verifiedResources,
              inactive: totalResources - activeResources
            },
            users: {
              total: totalUsers,
              active: activeUsers,
              inactive: totalUsers - activeUsers
            }
          },
          distributions: {
            byType: resourcesByType,
            byCategory: resourcesByCategory,
            byLearningType: resourcesByLearningType
          },
          topContent: {
            topRatedResources,
            popularSkills
          }
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users',
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'admin', 'moderator', 'instructor']),
    query('category').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        category,
        isActive,
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {};
      if (role) query.role = role;
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password -security.passwordResetToken -security.emailVerificationToken -security.twoFactorSecret')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PATCH /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.patch('/users/:id/role',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'admin', 'moderator', 'instructor']).withMessage('Invalid role')
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update user role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PATCH /api/admin/users/:id/ban
// @desc    Ban/Unban a user
// @access  Private/Admin
router.patch('/users/:id/ban',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isBanned').isBoolean().withMessage('isBanned must be a boolean'),
    body('banReason').optional().isString().trim(),
    body('bannedUntil').optional().isISO8601().withMessage('bannedUntil must be a valid date')
  ],
  validate,
  async (req, res) => {
    try {
      const { isBanned, banReason, bannedUntil } = req.body;

      const updateData = { 
        isBanned,
        banReason: isBanned ? banReason : null,
        bannedUntil: isBanned && bannedUntil ? new Date(bannedUntil) : null
      };

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to update ban status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;