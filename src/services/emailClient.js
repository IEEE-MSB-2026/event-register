// Email client for producing events to Redis Stream or direct HTTP fallback.
const { publishToStream } = require('./keydbService');
const { randomUUID } = require('crypto');

const STREAM = process.env.REDIS_STREAM_EMAIL || 'email_events';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL; // e.g. http://localhost:5060

function buildPayload({ to, subject, text, templateId, templateVersion, templateVars, attachments, priority }) {
  return {
    id: randomUUID(),
    correlationId: randomUUID(),
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    templateId,
    templateVersion,
    templateVars,
    attachments: (attachments || []).map(a => ({
      filename: a.filename,
      mimeType: a.mimeType || 'application/octet-stream',
      content: a.contentBase64 // caller must provide base64
    })),
    priority: priority || 'normal',
    createdAt: new Date().toISOString()
  };
}

async function sendEmailEvent(opts) {
  const payload = buildPayload(opts);
  try {
    await publishToStream(STREAM, payload);
    return { queued: true, id: payload.id };
  } catch (e) {
    // Fallback to direct HTTP if available
    if (EMAIL_SERVICE_URL) {
      return new Promise((resolve, reject) => {
        const req = require('node:http').request(
          `${EMAIL_SERVICE_URL}/email/send`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode < 300) return resolve({ fallback: true, response: data });
              reject(new Error(`Email service failed: ${res.statusCode}`));
            });
          }
        );
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
      });
    }
    throw e;
  }
}

module.exports = { sendEmailEvent };
