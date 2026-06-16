export function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return past.toLocaleDateString()
}

/**
 * Validates a proposed visit date and time.
 * Standard rules: must be at least 24 hours in the future, and during shelter hours (09:00 - 18:00).
 */
export function validateVisitDate(visitDateStr: string): { valid: boolean; error?: string } {
  if (!visitDateStr) {
    return { valid: false, error: 'Te rugăm să selectezi o dată și o oră pentru vizită.' };
  }
  
  const visitDate = new Date(visitDateStr);
  const now = new Date();
  
  // Rule 1: Must be at least 24 hours in the future
  const minimumTime = now.getTime() + 24 * 60 * 60 * 1000;
  if (visitDate.getTime() < minimumTime) {
    return { valid: false, error: 'Programarea trebuie făcută cu cel puțin 24 de ore în avans.' };
  }
  
  // Rule 2: Must be within standard hours (09:00 - 18:00)
  const hours = visitDate.getHours();
  if (hours < 9 || hours >= 18) {
    return { valid: false, error: 'Vizitele pot fi programate doar în intervalul de funcționare (09:00 - 18:00).' };
  }
  
  return { valid: true };
}
