import fs from 'fs';

const STORAGE_FILE = '/tmp/portfolio_messages.json';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const authKey = req.query.key || req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'gokulns2026';

  if (authKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized. Pass ?key=gokulns2026 in the URL to view inquiries.'
    });
  }

  let messages = [];
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      messages = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading messages:', err);
  }

  return res.status(200).json({
    portfolio: 'GokulNs Portfolio',
    total: messages.length,
    messages
  });
}
