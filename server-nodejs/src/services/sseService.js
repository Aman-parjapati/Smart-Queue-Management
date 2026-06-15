// Manages all SSE client connections per business
// Map<businessId, Map<clientId, { res, slotId }>>
const clients = new Map();

function addClient(businessId, clientId, res, slotId = null) {
  if (!clients.has(businessId)) {
    clients.set(businessId, new Map());
  }
  clients.get(businessId).set(clientId, { res, slotId });
  console.log(`SSE client ${clientId} connected to business ${businessId} for slot ${slotId}`);
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
  
  biz.forEach(({ res, slotId }) => {
    // Only send to clients who either haven't filtered by slotId,
    // or whose slotId matches the updated data's slotId.
    if (!slotId || slotId === data.slotId) {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      try {
        res.write(payload);
      } catch {
        /* client gone */
      }
    }
  });
}

module.exports = { addClient, removeClient, broadcastQueue };
