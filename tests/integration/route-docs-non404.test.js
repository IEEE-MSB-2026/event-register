const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const eventRoutes = require('../../src/api/routes/eventRoutes');
const baseRoutes = require('../../src/api/routes/baseRoutes');
const adminRoutes = require('../../src/api/routes/adminRoutes');
const { authMiddleware } = require('../../src/middlewares/auth');
const { getAllRoutes } = require('../../src/api/controllers/baseController');

function createServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function getBaseUrl(server) {
  const addr = server.address();
  return `http://127.0.0.1:${addr.port}`;
}

function makeJsonRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function materializePath(pathname) {
  return pathname
    .replace(':eventId', '507f1f77bcf86cd799439011')
    .replace(':participantId', '507f191e810c19729de860ea')
    .replace(':activityId', '507f191e810c19729de860eb')
    .replace(':KeyName', 'organizer');
}

test('route docs contract: documented endpoints resolve on mounted routers (non-404)', async () => {
  const docsRes = makeJsonRes();
  getAllRoutes({}, docsRes);

  assert.equal(docsRes.statusCode, 200);
  assert.ok(Array.isArray(docsRes.body.routes));
  assert.ok(docsRes.body.routes.length > 0);

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1', baseRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  const server = await createServer(app);
  const failures = [];

  try {
    for (const route of docsRes.body.routes) {
      const resolvedPath = materializePath(route.path);
      const response = await fetch(`${getBaseUrl(server)}${resolvedPath}`, {
        method: 'OPTIONS',
      });

      if (response.status === 404) {
        failures.push({
          route: `${route.method} ${route.path}`,
          resolvedPath,
          status: response.status,
        });
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  assert.deepEqual(failures, []);
});
