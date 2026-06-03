const supabase = require('../db/supabase');
const redis    = require('../db/redis');

/**
 * Returns all non-done bookings for a slot, ordered by token_number.
 * Caches in Redis for 10 seconds to avoid hammering Postgres.
 */
async function getQueueState(slotId) {
  const cacheKey = `queue:${slotId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('bookings')
    .select('id, token_number, status, user_id, users(name)')
    .eq('slot_id', slotId)
    .not('status', 'eq', 'done')
    .order('token_number', { ascending: true });

  if (error) throw error;

  await redis.set(cacheKey, data, { ex: 10 });
  return data;
}

/**
 * Invalidates the Redis cache for a slot's queue.
 */
async function invalidateCache(slotId) {
  await redis.del(`queue:${slotId}`);
}

/**
 * Calculates estimated wait time for a given token position.
 * avgServiceTime is in minutes.
 */
function calcWaitTime(position, avgServiceTime = 10) {
  if (position <= 0) return 0;
  return position * avgServiceTime;
}

/**
 * Returns the next pending/arrived booking in line.
 */
async function getNextInQueue(slotId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('slot_id', slotId)
    .in('status', ['pending', 'arrived'])
    .order('token_number', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

module.exports = { getQueueState, invalidateCache, calcWaitTime, getNextInQueue };
