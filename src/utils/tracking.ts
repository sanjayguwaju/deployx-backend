export function generateTrackingNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${random}`;
}

export function generateRefNumber(tenantCode: string, fiscalYear: string, seq: number): string {
  return `${tenantCode}-${fiscalYear}-${String(seq).padStart(4, "0")}`;
}
