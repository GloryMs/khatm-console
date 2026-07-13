// Same-origin: nginx (docker) or Vite proxy (dev) forwards /api to the backend.
async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

export const api = {
  issue: (req) => post('/api/issue', req),
  verify: (jwt) => post('/api/verify', { jwt }),
  consume: (id, consumer, idempotencyKey) =>
    post('/api/consume', { id, consumer, idempotencyKey }),
  revoke: async (id) => (await fetch('/api/revoke/' + id, { method: 'POST' })).json()
}
