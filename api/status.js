export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'online',
    portfolio: 'GokulNs Portfolio',
    owner: 'Gokul Ns',
    contactEmail: 'gokularun201@gmail.com',
    serverTime: new Date().toISOString(),
    version: '1.0.0'
  });
}
