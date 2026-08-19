export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidAssignmentType = (type: string): boolean => {
  return ['text', 'quiz', 'audio', 'image', 'pdf', 'interactive'].includes(type);
};

export const isValidISODate = (value: string): boolean => {
  const d = new Date(value);
  return !isNaN(d.getTime());
};

interface RequiredFieldsResult {
  valid: boolean;
  missing: string[];
}

export const requireFields = (body: Record<string, any>, fields: string[]): RequiredFieldsResult => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  return { valid: missing.length === 0, missing };
};
