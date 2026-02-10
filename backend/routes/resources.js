const express = require('express');
const mongoose = require('mongoose');
const { param, query, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Constants (aligned with README schema)
const VALID_CATEGORIES = ['children', 'students', 'senior_citizens'];
const VALID_LEARNING_TYPES = ['free', 'premium'];
const VALID_RESOURCE_TYPES = ['youtube', 'udemy', 'coursera', 'other'];
const VALID_SORT_FIELDS = ['createdAt', 'title', 'bookmarkCount', 'viewCount', 'rating'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Validation middleware
const validateResourceQuery = [
  query('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  query('learningType')
    .optional()
    .isIn(VALID_LEARNING_TYPES)
    .withMessage(`Learning type must be one of: ${VALID_LEARNING_TYPES.join(', ')}`),
  query('type')
    .optional()
    .isIn(VALID_RESOURCE_TYPES)
    .withMessage(`Resource type must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`),
  query('skill')
    .optional()
    .isMongoId()
    .withMessage('Invalid skill ID format'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${MAX_LIMIT}`),
  query('sort')
    .optional()
    .custom((value) => {
      const field = value.replace('-', '');
      return VALID_SORT_FIELDS.includes(field);
    })
    .withMessage(`Sort field must be one of: ${VALID_SORT_FIELDS.join(', ')} (prefix with - for descending)`)
];

const validateResourceId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resource ID format')
];

// Helper functions
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

const buildResourceQuery = (filters) => {
  // Public resources should only return active, verified items
  const query = { isActive: true, verified: true };
  
  if (filters.category) query.category = filters.category;
  if (filters.learningType) query.learningType = filters.learningType;
  if (filters.type) query.type = filters.type;
  if (filters.skill) query.skill = filters.skill;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.isFree !== undefined) query.isFree = filters.isFree === 'true';
  
  if (filters.search) {
    const searchRegex = { $regex: filters.search, $options: 'i' };
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ];
  }
  
  return query;
};

// @route   GET /api/resources
// @desc    Get all resources with advanced filters and pagination
// @access  Public
router.get('/', validateResourceQuery, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const {
      category,
      learningType,
      type,
      skill,
      search,
      difficulty,
      isFree,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sort = '-createdAt'
    } = req.query;

    const query = buildResourceQuery({
      category,
      learningType,
      type,
      skill,
      difficulty,
      isFree,
      search
    });

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('skill', 'name category description icon')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Resource.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        },
        filters: {
          category,
          learningType,
          type,
          skill,
          difficulty,
          isFree,
          search
        }
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resources'
    });
  }
});

// @route   GET /api/resources/featured
// @desc    Get featured resources
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 10, category } = req.query;
    const limitNum = Math.min(parseInt(limit), 50);

    // Only return active, verified, featured resources
    const query = { isActive: true, verified: true, isFeatured: true };
    if (category) query.category = category;

    const resources = await Resource.find(query)
      .populate('skill', 'name category description icon')
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        resources,
        count: resources.length
      }
    });
  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured resources'
    });
  }
});

// @route   GET /api/resources/popular
// @desc    Get most popular resources
// @access  Public
router.get('/popular/list', async (req, res) => {
  try {
    const { limit = 10, category, timeframe = 'all' } = req.query;
    const limitNum = Math.min(parseInt(limit), 50);

    // Only return active, verified resources
    const query = { isActive: true, verified: true };
    if (category) query.category = category;

    // Add timeframe filter if needed
    if (timeframe !== 'all') {
      const days = {
        'week': 7,
        'month': 30,
        'year': 365
      };
      if (days[timeframe]) {
        const date = new Date();
        date.setDate(date.getDate() - days[timeframe]);
        query.createdAt = { $gte: date };
      }
    }

    const resources = await Resource.find(query)
      .populate('skill', 'name category description icon')
      .sort({ bookmarkCount: -1, viewCount: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        resources,
        count: resources.length,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular resources'
    });
  }
});

// @route   GET /api/resources/stats
// @desc    Get resource statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const { category } = req.query;
    // Public stats should reflect only active, verified resources
    const baseQuery = { isActive: true, verified: true };
    if (category) baseQuery.category = category;

    const [
      totalCount,
      typeStats,
      categoryStats,
      learningTypeStats
    ] = await Promise.all([
      Resource.countDocuments(baseQuery),
      Resource.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Resource.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Resource.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$learningType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        byType: typeStats,
        byCategory: categoryStats,
        byLearningType: learningTypeStats
      }
    });
  } catch (error) {
    console.error('Get resource stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resource statistics'
    });
  }
});

// @route   GET /api/resources/:id
// @desc    Get single resource with detailed information
// @access  Public
router.get('/:id', validateResourceId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const resource = await Resource.findById(req.params.id)
      .populate('skill', 'name category description icon')
      .lean();

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (!resource.isActive || !resource.verified) {
      return res.status(410).json({
        success: false,
        message: 'This resource is no longer available'
      });
    }

    // Increment view count asynchronously (don't wait for it)
    Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: false }
    ).catch(err => console.error('Error incrementing view count:', err));

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Get resource error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resource'
    });
  }
});

// @route   GET /api/resources/:id/related
// @desc    Get related resources
// @access  Public
router.get('/:id/related', validateResourceId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { limit = 5 } = req.query;
    const limitNum = Math.min(parseInt(limit), 20);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Find related resources based on skill, category, or type
    const related = await Resource.find({
      _id: { $ne: req.params.id },
      isActive: true,
      verified: true,
      $or: [
        { skill: resource.skill },
        { category: resource.category, type: resource.type },
        { tags: { $in: resource.tags || [] } }
      ]
    })
      .populate('skill', 'name category description icon')
      .sort({ bookmarkCount: -1, createdAt: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        resources: related,
        count: related.length
      }
    });
  } catch (error) {
    console.error('Get related resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve related resources'
    });
  }
});

// @route   POST /api/resources/:id/view
// @desc    Track resource view (alternative explicit endpoint)
// @access  Public
router.post('/:id/view', validateResourceId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    // Only track views for active, verified resources
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, isActive: true, verified: true },
      { $inc: { viewCount: 1 } },
      { new: true, select: 'viewCount' }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: {
        viewCount: resource.viewCount
      }
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
});

module.exports = router;