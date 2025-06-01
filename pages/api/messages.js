let messages = [];
let nextId = 1;
let users = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(messages);
  }
  if (req.method === 'POST') {
    const { content, userId } = req.body;
    if (!content || !userId) return res.status(400).json({ error: 'Missing content or userId' });
    let user = users.find(u => u.id === userId);
    if (!user) {
      user = { id: userId, name: 'Unknown' };
    }
    const message = {
      id: nextId++,
      content,
      createdAt: new Date().toISOString(),
      user,
      userId
    };
    messages.push(message);
    return res.status(201).json(message);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
