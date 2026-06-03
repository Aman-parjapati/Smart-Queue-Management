// Manages all SSE client connections per business
// Map<businessId, Map<clientId, res>>
const clients = new Map();

function addClient(businessId, clientId, res) {
  if (!clients.has(businessId)) {
    clients.set(businessId, new Map());
  }
  clients.get(businessId).set(clientId, res);
  console.log(`SSE client ${clientId} connected to business ${businessId}`);
}

function removeClient(businessId, clientId) {
  const biz = clients.get(businessId);
  if (biz) {
    biz.delete(clientId);
    if (biz.size === 0) clients.delete(businessId);
  }
  console.log(`SSE client ${clientId} disconnected from business ${businessId}`);
}

function broadcastQueue(businessId, data) {
  const biz = clients.get(businessId);
  if (!biz) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  biz.forEach((res) => {
    try { res.write(payload); } catch { /* client gone */ }
  });
}

module.exports = { addClient, removeClient, broadcastQueue };
