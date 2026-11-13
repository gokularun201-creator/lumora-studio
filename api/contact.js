import fs from 'fs';

const IN_MEMORY_MESSAGES = [];
const STORAGE_FILE = '/tmp/portfolio_messages.json';

function getStoredMessages() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading messages file:', err);
  }
  return IN_MEMORY_MESSAGES;
}

function saveMessage(message) {
  try {
    const list = getStoredMessages();
    list.unshift(message);
    if (list.length > 100) list.length = 100;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    IN_MEMORY_MESSAGES.unshift(message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  let body = null;
  try {
    body = req.body;
  } catch (parseErr) {
    return res.status(400).json({ error: 'Invalid JSON request payload.' });
  }

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON string provided.' });
    }
  }

  const { name, email, project } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!project || typeof project !== 'string' || project.trim().length < 4) {
    return res.status(400).json({ error: 'Please write a brief note about your project.' });
  }

  const entry = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    project: project.trim(),
    submittedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  saveMessage(entry);
  console.log('[New Lead Stored]:', entry.id, entry.name, entry.email);

  if (process.env.NOTIFICATION_WEBHOOK_URL) {
    try {
      await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚀 **New Project Inquiry for Gokul Ns!**\n**From:** ${entry.name} (${entry.email})\n**Project:** ${entry.project}\n**Time:** ${entry.submittedAt}`
        })
      });
    } catch (notifyErr) {
      console.error('Webhook notification error:', notifyErr);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Thank you, ' + entry.name + '! Your inquiry has been sent to Gokul Ns.',
    id: entry.id
  });
}
