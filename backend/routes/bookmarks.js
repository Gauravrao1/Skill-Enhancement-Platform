const express = require('express');
const { param, validationResult } = require('express-validator');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: handle validation errors
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

// @route   GET /api/bookmarks
// @desc    Get user's bookmarks (as resources)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks.resource',
        populate: { path: 'skill', select: 'name category' }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Flatten to an array of resources to match README shape
    const bookmarks = (user.bookmarks || [])
      .filter(b => b.resource && b.resource.isActive)
      .map(b => {
        const r = b.resource;
        return {
          _id: r._id,
          title: r.title,
          description: r.description,
          url: r.url,
          type: r.type,
          learningType: r.learningType,
          skill: r.skill
            ? {
                _id: r.skill._id,
                name: r.skill.name,
                category: r.skill.category
              }
            : undefined,
          category: r.category,
          level: r.level,
          thumbnail: r.thumbnail,
          verified: r.verified,
          creator: r.creator,
          duration: r.duration,
          rating: r.rating,
          isActive: r.isActive,
          createdAt: r.createdAt,
          // Optional metadata from bookmark entry
          bookmarkedAt: b.addedAt,
          notes: b.notes,
          progress: b.progress
        };
      });

    res.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmarks'
    });
  }
});

// Validation for :resourceId params
const validateResourceId = [
  param('resourceId')
    .isMongoId()
    .withMessage('Invalid resource ID format')
];

// @route   POST /api/bookmarks/:resourceId
// @desc    Add resource to bookmarks
// @access  Private
router.post('/:resourceId', authenticate, validateResourceId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.addBookmark(resourceId);

    res.status(201).json({
      success: true,
      message: 'Resource added to bookmarks'
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bookmark'
    });
  }
});

// @route   DELETE /api/bookmarks/:resourceId
// @desc    Remove resource from bookmarks
// @access  Private
router.delete('/:resourceId', authenticate, validateResourceId, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { resourceId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.removeBookmark(resourceId);

    res.json({
      success: true,
      message: 'Resource removed from bookmarks'
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove bookmark'
    });
  }
});

module.exports = router;
