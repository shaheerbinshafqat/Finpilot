// Audit log entry shape:
// { id, timestamp, action, entityType, entityId, before, after, summary }

export function createAuditEntry(action, entityType, entityId, before, after) {
  const summary = summarize(action, entityType, before, after);
  return {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    timestamp: Date.now(),
    action,        // 'create' | 'update' | 'delete' | 'restore'
    entityType,    // 'transaction' | 'expense' | 'cashMove' | 'alert'
    entityId,
    before,        // snapshot before change (null for create)
    after,         // snapshot after change (null for delete)
    summary,
  };
}

function summarize(action, entityType, before, after) {
  const obj = after || before;
  if (entityType === 'transaction') {
    return `${action} ${obj.type} ${obj.quantity} ${obj.ticker} @ ${obj.price}`;
  }
  if (entityType === 'expense') {
    return `${action} expense ${obj.description} — ₨${obj.amount}`;
  }
  if (entityType === 'cashMove') {
    return `${action} ${obj.type} ₨${obj.amount}`;
  }
  if (entityType === 'alert') {
    return `${action} alert ${obj.ticker} ${obj.type} ${obj.value}`;
  }
  return `${action} ${entityType}`;
}

// Cap audit log at 500 entries — older ones get trimmed
export function appendAudit(auditLog, entry) {
  const next = [entry, ...auditLog];
  return next.slice(0, 500);
}