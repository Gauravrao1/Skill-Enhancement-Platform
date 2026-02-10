const express = require('express');
const mongoose = require('mongoose');
const { param, query, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const Resource = require('../models/Resource');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Constants (aligned with README schema)
const VALID_CATEGORIES = ['children', 'students', 'senior_citizens'];
const VALID_LEARNING_TYPES = ['free', 'premium'];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];
const VALID_SORT_FIELDS = ['name', 'createdAt', 'resourceCount', 'popularity'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Validation middleware
const validateSkillQuery = [
  query('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
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

const validateSkillId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid skill ID format')
];

const validateResourceQuery = [
  query('learningType')
    .optional()
    .isIn(VALID_LEARNING_TYPES)
    .withMessage(`Learning type must be one of: ${VALID_LEARNING_TYPES.join(', ')}`),
  query('level')
    .optional()
    .isIn(VALID_LEVELS)
    .withMessage(`Level must be one of: ${VALID_LEVELS.join(', ')}`),
  query('type')
    .optional()
    .isString()
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${MAX_LIMIT}`)
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

const buildSkillQuery = (filters) => {
  // Only return active skills that haven't been soft-deleted
  const query = { isActive: true, deletedAt: null };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.search) {
    const searchRegex = { $regex: filters.search, $options: 'i' };
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ];
  }
  
  if (filters.featured !== undefined) {
    query.isFeatured = filters.featured === 'true';
  }
  
  return query;
};

// @route   GET /api/skills
// @desc    Get all skills with advanced filtering and pagination
// @access  Public
router.get('/', validateSkillQuery, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const {
      category,
      search,
      featured,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sort = 'name',
      includeResourceCount = 'true'
    } = req.query;

    const query = buildSkillQuery({ category, search, featured });

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation pipeline for resource count
    let skillsQuery;
    if (includeResourceCount === 'true') {
      skillsQuery = Skill.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'resources',
            localField: '_id',
            foreignField: 'skill',
            as: 'resourcesList'
          }
        },
        {
          $addFields: {
            resourceCount: {
              $size: {
                $filter: {
                  input: '$resourcesList',
                  as: 'resource',
                  cond: { 
                    $and: [
                      { $eq: ['$$resource.isActive', true] },
                      { $eq: ['$$resource.verified', true] },
                      { $or: [
                        { $eq: ['$$resource.deletedAt', null] },
                        { $not: '$$resource.deletedAt' }
                      ]}
                    ]
                  }
                }
              }
            }
          }
        },
        { $project: { resourcesList: 0 } },
        { $sort: { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } },
        { $skip: skip },
        { $limit: limitNum }
      ]);
    } else {
      skillsQuery = Skill.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
    }

    const [skills, total] = await Promise.all([
      skillsQuery,
      Skill.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        skills,
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
          search,
          featured
        }
      }
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skills'
    });
  }
});

// @route   GET /api/skills/featured
// @desc    Get featured skills
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit), 50);

    const query = { isActive: true, isFeatured: true };
    if (category) query.category = category;

    const skills = await Skill.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: 'skill',
          as: 'resourcesList'
        }
      },
      {
        $addFields: {
          resourceCount: {
            $size: {
              $filter: {
                input: '$resourcesList',
                as: 'resource',
                cond: { $eq: ['$$resource.isActive', true] }
              }
            }
          }
        }
      },
      { $project: { resourcesList: 0 } },
      { $sort: { featuredOrder: 1, name: 1 } },
      { $limit: limitNum }
    ]);

    res.json({
      success: true,
      data: {
        skills,
        count: skills.length
      }
    });
  } catch (error) {
    console.error('Get featured skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured skills'
    });
  }
});

// @route   GET /api/skills/popular
// @desc    Get most popular skills (by resource count)
// @access  Public
router.get('/popular/list', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit), 50);

    const matchStage = { isActive: true };
    if (category) matchStage.category = category;

    const skills = await Skill.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: 'skill',
          as: 'resourcesList'
        }
      },
      {
        $addFields: {
          resourceCount: {
            $size: {
              $filter: {
                input: '$resourcesList',
                as: 'resource',
                cond: { $eq: ['$$resource.isActive', true] }
              }
            }
          }
        }
      },
      { $project: { resourcesList: 0 } },
      { $sort: { resourceCount: -1, name: 1 } },
      { $limit: limitNum }
    ]);

    res.json({
      success: true,
      data: {
        skills,
        count: skills.length
      }
    });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular skills'
    });
  }
});

// @route   GET /api/skills/stats
// @desc    Get skill statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const { category } = req.query;
    const baseQuery = { isActive: true };
    if (category) baseQuery.category = category;

    const [
      totalCount,
      categoryStats,
      skillsWithMostResources
    ] = await Promise.all([
      Skill.countDocuments(baseQuery),
      Skill.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Skill.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: 'resources',
            localField: '_id',
            foreignField: 'skill',
            as: 'resources'
          }
        },
        {
          $addFields: {
            resourceCount: {
              $size: {
                $filter: {
                  input: '$resources',
                  as: 'resource',
                  cond: { 
                    $and: [
                      { $eq: ['$$resource.isActive', true] },
                      { $eq: ['$$resource.verified', true] }
                    ]
                  }
                }
              }
            }
          }
        },
        { $sort: { resourceCount: -1 } },
        { $limit: 5 },
        { $project: { name: 1, category: 1, resourceCount: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        byCategory: categoryStats,
        topSkillsByResources: skillsWithMostResources
      }
    });
  } catch (error) {
    console.error('Get skill stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skill statistics'
    });
  }
});

// @route   GET /api/skills/:id
// @desc    Get single skill with resources (default) or summary info
// @access  Public
router.get('/:id', validateSkillId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { includeResources = 'true' } = req.query;

    let skill;
    if (includeResources === 'true') {
      skill = await Skill.findById(req.params.id)
        .populate({
          path: 'resources',
          // When including resources for a skill, only expose active, verified items
          match: { isActive: true, verified: true },
          options: { sort: { createdAt: -1 } }
        })
        .lean();
    } else {
      skill = await Skill.findById(req.params.id).lean();
    }

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    if (!skill.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This skill is no longer available'
      });
    }

    // Get resource count if not including full resources
    if (includeResources !== 'true') {
      const resourceCount = await Resource.countDocuments({
        skill: req.params.id,
        isActive: true
      });
      skill.resourceCount = resourceCount;
    }

    res.json({
      success: true,
      data: skill
    });
  } catch (error) {
    console.error('Get skill error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skill'
    });
  }
});

// @route   GET /api/skills/:id/resources
// @desc    Get resources for a skill with advanced filtering
// @access  Public
router.get('/:id/resources', [...validateSkillId, ...validateResourceQuery], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    // Verify skill exists
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    if (!skill.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This skill is no longer available'
      });
    }

    const {
      learningType,
      level,
      type,
      isFree,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sort = '-createdAt'
    } = req.query;

    const query = {
      skill: req.params.id,
      isActive: true,
      verified: true
    };

    if (learningType) query.learningType = learningType;
    if (level) query.level = level;
    if (type) query.type = type;
    if (isFree !== undefined) query.isFree = isFree === 'true';

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Resource.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        skill: {
          id: skill._id,
          name: skill.name,
          category: skill.category,
          description: skill.description
        },
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
          learningType,
          level,
          type,
          isFree
        }
      }
    });
  } catch (error) {
    console.error('Get skill resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skill resources'
    });
  }
});

// @route   GET /api/skills/:id/related
// @desc    Get related skills
// @access  Public
router.get('/:id/related', validateSkillId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { limit = 5 } = req.query;
    const limitNum = Math.min(parseInt(limit), 20);

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Find related skills based on category and tags
    const related = await Skill.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
          isActive: true,
          $or: [
            { category: skill.category },
            { tags: { $in: skill.tags || [] } }
          ]
        }
      },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: 'skill',
          as: 'resourcesList'
        }
      },
      {
        $addFields: {
          resourceCount: {
            $size: {
              $filter: {
                input: '$resourcesList',
                as: 'resource',
                cond: { $eq: ['$$resource.isActive', true] }
              }
            }
          }
        }
      },
      { $project: { resourcesList: 0 } },
      { $sort: { resourceCount: -1, name: 1 } },
      { $limit: limitNum }
    ]);

    res.json({
      success: true,
      data: {
        skills: related,
        count: related.length
      }
    });
  } catch (error) {
    console.error('Get related skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve related skills'
    });
  }
});

module.exports = router;