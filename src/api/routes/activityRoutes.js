const express = require('express');
const router = express.Router({ mergeParams: true });

const activityController = require('../controllers/activityController');
const { validateCreateActivity } = require('../validators/activityValidator');
const validateRequest = require('../../middlewares/validateRequest');
const { requireRole } = require('../../middlewares/auth');

router.post('/', requireRole('organizer', 'admin'), validateCreateActivity, validateRequest, activityController.createActivity);
router.get('/', requireRole('organizer', 'scanner', 'admin'), activityController.getEventActivities);
router.get('/:activityId', requireRole('organizer', 'scanner', 'admin'), activityController.getActivityById);

module.exports = router;