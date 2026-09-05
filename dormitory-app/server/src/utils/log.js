import { db } from '../db.js';

export function logActivity(actor, action, detail) {
  db.prepare('INSERT INTO activity_log (actor, action, detail) VALUES (?, ?, ?)').run(actor, action, detail ?? null);
}
