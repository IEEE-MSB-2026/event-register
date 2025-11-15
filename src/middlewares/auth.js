const { getKey } = require('../services/keydbService');

const getAPIKeys = async () => {
  let apiKeys = {};
  const config = require('../config');
  apiKeys[config.apiKeys.admin] = 'admin';
  apiKeys[await getKey(config.apiKeys.organizerId)] = 'organizer';
  apiKeys[await getKey(config.apiKeys.scannerId)] = 'scanner';

  return apiKeys;
}

const authMiddleware = async (req, res, next) => {
  const apiKeys = await getAPIKeys();
  const key = req.headers['x-api-key'];
  const role = apiKeys[key] || 'user';

  req.auth = { role }; // Inject role into request
  next();
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};
