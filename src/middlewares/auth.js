const { getKey } = require('../services/keydbService');
const config = require('../config');

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeKey(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function assertAuthConfig() {
  if (!normalizeKey(config.apiKeys.admin)) {
    throw new Error('Missing required ADMIN_API_KEY');
  }
  if (!normalizeKey(config.apiKeys.organizerId)) {
    throw new Error('Missing required ORGANIZER_ID');
  }
  if (!normalizeKey(config.apiKeys.scannerId)) {
    throw new Error('Missing required SCANNER_ID');
  }
}

const getAPIKeys = async () => {
  assertAuthConfig();

  const apiKeys = new Map();
  apiKeys.set(normalizeKey(config.apiKeys.admin), 'admin');

  const organizerKey = normalizeKey(await getKey(config.apiKeys.organizerId));
  const scannerKey = normalizeKey(await getKey(config.apiKeys.scannerId));
  if (!organizerKey || !scannerKey) {
    throw new Error('Role keys are unavailable (Redis missing or keys not issued)');
  }

  apiKeys.set(organizerKey, 'organizer');
  apiKeys.set(scannerKey, 'scanner');
  return apiKeys;
}

const authMiddleware = async (req, res, next) => {
  try {
    const key = normalizeKey(normalizeHeaderValue(req.headers['x-api-key']));
    if (!key) {
      req.auth = { role: 'anonymous', authReady: true };
      return next();
    }

    const apiKeys = await getAPIKeys();
    const role = apiKeys.get(key) || 'anonymous';
    req.auth = { role, authReady: true }; // Inject role into request
    return next();
  } catch (err) {
    req.auth = { role: 'anonymous', authReady: false, error: err.message };
    return next();
  }
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth || req.auth.authReady === false) {
      return res.status(503).json({ error: 'Authorization subsystem unavailable' });
    }
    if (!req.auth || !req.auth.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.auth.role === 'anonymous') {
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
  assertAuthConfig,
  requireRole,
};
