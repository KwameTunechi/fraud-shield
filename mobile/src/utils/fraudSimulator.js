export function calculateRiskScore(transaction) {
  let score = 0;
  const hour = new Date(transaction.time).getHours();
  if (hour >= 22 || hour <= 5) score += 25;
  if (transaction.amount > 2000) score += 20;
  if (transaction.isNewRecipient) score += 20;
  if (transaction.location !== 'Ghana') score += 30;
  if (transaction.rapid) score += 15;
  return Math.min(score, 100);
}

export function getRiskLabel(score) {
  if (score < 30) return { label: 'Low', color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' };
  if (score < 65) return { label: 'Medium', color: '#d97706', bg: '#fef9c3', dot: '#f59e0b' };
  return { label: 'High', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' };
}

export function getStatusStyle(status) {
  switch (status) {
    case 'completed': return { label: 'Completed', color: '#16a34a', bg: '#dcfce7' };
    case 'review': return { label: 'Under Review', color: '#d97706', bg: '#fef9c3' };
    case 'blocked': return { label: 'Blocked', color: '#dc2626', bg: '#fee2e2' };
    case 'pending': return { label: 'Pending', color: '#2563eb', bg: '#dbeafe' };
    default: return { label: status, color: '#64748b', bg: '#f1f5f9' };
  }
}

export function simulateAIAnalysis(amount, isNewRecipient, location, hour) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let score = 0;
      const flags = [];
      if (hour >= 22 || hour <= 5) { score += 25; flags.push('Late-night transaction'); }
      if (amount > 2000) { score += 20; flags.push('High transaction amount'); }
      if (isNewRecipient) { score += 20; flags.push('New recipient'); }
      if (location !== 'Ghana') { score += 30; flags.push('Unusual location'); }
      resolve({ score: Math.min(score, 100), flags });
    }, 1800);
  });
}

export function formatCurrency(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₵${formatted}`;
}

export function shortenHash(hash) {
  if (!hash) return '';
  return hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
}
