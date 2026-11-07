import { handleBackendRequest } from '../server/api.js';

export default async function handler(req, res) {
  return handleBackendRequest(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });
}
