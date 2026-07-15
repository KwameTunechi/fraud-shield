export const REASON_EXPLANATIONS = {
  late_night: {
    title: 'Sent During Late-Night Hours',
    detail: 'This transaction was initiated between 10:00 PM and 5:00 AM Ghana time. Fraudulent transactions are statistically more common during late-night hours when victims are less likely to be monitoring their accounts.',
    points: 25,
    severity: 'medium',
    icon: '🌙',
  },
  amount_above_2000_ghs: {
    title: 'Large Transaction Amount',
    detail: 'The amount exceeds ₵2,000, which is significantly above the typical mobile money transfer. Large single transfers are a common pattern in fraud cases, especially account takeovers and SIM swap attacks.',
    points: 20,
    severity: 'medium',
    icon: '💰',
  },
  amount_above_threshold_airtime: {
    title: 'Unusually Large Airtime/Bill Top-up',
    detail: 'The amount exceeds ₵500, well above a typical airtime or bill top-up. Airtime purchases are a known fraud pattern — attackers with a compromised account often buy large top-ups to convert stolen balance into resellable value.',
    points: 20,
    severity: 'medium',
    icon: '📱',
  },
  new_recipient: {
    title: 'First-Time Recipient',
    detail: "The sender has never previously sent money to this phone number. First-time transfers to unknown recipients carry elevated risk because fraudsters typically direct stolen funds to new, unlinked accounts.",
    points: 20,
    severity: 'medium',
    icon: '👤',
  },
  amount_3x_rolling_avg: {
    title: 'Amount Far Exceeds Normal Behaviour',
    detail: "This transaction is more than 3× the sender's average transfer amount over the past 30 days. A sudden spike in transfer size is a strong indicator of account compromise — the legitimate account owner rarely changes their spending pattern this dramatically.",
    points: 15,
    severity: 'medium',
    icon: '📈',
  },
  amount_3x_avg: {
    title: 'Amount Far Exceeds Normal Behaviour',
    detail: "This transaction is more than 3× the sender's average transfer amount over the past 30 days. A sudden spike in transfer size is a strong indicator of account compromise.",
    points: 15,
    severity: 'medium',
    icon: '📈',
  },
  rapid_succession: {
    title: 'Unusually High Transaction Frequency',
    detail: 'The sender made more than 3 transactions within the last 10 minutes. This rapid-fire pattern is a hallmark of account compromise — attackers attempt to drain funds as quickly as possible before the victim notices and locks the account.',
    points: 15,
    severity: 'medium',
    icon: '⚡',
  },
  recipient_flagged_in_alerts: {
    title: 'Recipient Linked to Known Fraud',
    detail: "The recipient's phone number has appeared in a fraud alert within the last 30 days. This is a strong signal — the recipient account has previously been associated with fraudulent activity and may be a money mule account used to collect stolen funds.",
    points: 50,
    severity: 'critical',
    icon: '🚨',
  },
  recipient_flagged: {
    title: 'Recipient Linked to Known Fraud',
    detail: "The recipient's phone number has appeared in a fraud alert within the last 30 days. The recipient account may be a money mule account used to collect stolen funds.",
    points: 50,
    severity: 'critical',
    icon: '🚨',
  },
}

export const STATUS_EXPLANATIONS = {
  completed: {
    headline: 'Transaction Cleared — Low Risk',
    detail: 'The AI risk engine scored this transaction below the review threshold (30 points). No significant risk signals were detected, and the transaction was automatically approved and processed.',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  review: {
    headline: 'Flagged for Human Review — Moderate Risk',
    detail: 'The AI risk score fell between 30 and 69 points, indicating moderate risk. The transaction was held and escalated to a human reviewer. It will not be processed until an admin approves or rejects it.',
    color: '#d97706',
    bg: '#fffbeb',
  },
  blocked: {
    headline: 'Transaction Blocked — High Risk',
    detail: 'The AI risk score reached 70 or above, triggering an automatic block. The transaction was rejected immediately to protect the sender. The customer has been notified and the incident has been logged to the blockchain audit trail.',
    color: '#dc2626',
    bg: '#fef2f2',
  },
}
