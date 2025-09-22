/**
 * Security utilities for input validation and sanitization
 */

// DOMPurify is only available on client side
let DOMPurify: any = null;
if (typeof window !== 'undefined') {
  try {
    DOMPurify = require('isomorphic-dompurify');
  } catch (error) {
    console.warn('DOMPurify not available:', error);
  }
}

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  title: /^[\w\s\-.,!?()]{1,100}$/,
  description: /^[\w\s\-.,!?()@#$%&*+=\[\]{}|\\:;"'<>\/]{0,1000}$/,
  id: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// Sanitization options for different contexts
const SANITIZE_OPTIONS = {
  basic: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  },
  html: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: [],
  },
  minimal: {
    ALLOWED_TAGS: ['strong', 'em', 'u'],
    ALLOWED_ATTR: [],
  },
} as const;

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(content: string, level: keyof typeof SANITIZE_OPTIONS = 'basic'): string {
  if (!content || typeof content !== 'string') return '';

  // During SSR, DOMPurify might not be available
  if (!DOMPurify) {
    // Fallback: basic HTML entity escaping for SSR
    return escapeHtml(content);
  }

  return DOMPurify.sanitize(content, SANITIZE_OPTIONS[level]);
}

/**
 * Validates input against a pattern
 */
export function validateInput(input: string, pattern: RegExp): boolean {
  if (!input || typeof input !== 'string') return false;
  return pattern.test(input.trim());
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  return validateInput(email, VALIDATION_PATTERNS.email);
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): boolean {
  return validateInput(password, VALIDATION_PATTERNS.password);
}

/**
 * Validates username format
 */
export function validateUsername(username: string): boolean {
  return validateInput(username, VALIDATION_PATTERNS.username);
}

/**
 * Validates title format
 */
export function validateTitle(title: string): boolean {
  return validateInput(title, VALIDATION_PATTERNS.title);
}

/**
 * Validates description format
 */
export function validateDescription(description: string): boolean {
  return validateInput(description, VALIDATION_PATTERNS.description);
}

/**
 * Validates UUID format
 */
export function validateId(id: string): boolean {
  return validateInput(id, VALIDATION_PATTERNS.id);
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  return validateInput(url, VALIDATION_PATTERNS.url);
}

/**
 * Escapes HTML entities
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

/**
 * Trims and normalizes whitespace
 */
export function normalizeWhitespace(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Validates and sanitizes user input for different contexts
 */
export function validateAndSanitize(
  input: string,
  type: 'email' | 'password' | 'username' | 'title' | 'description' | 'url',
  sanitizeLevel: keyof typeof SANITIZE_OPTIONS = 'basic'
): { isValid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input must be a non-empty string' };
  }

  const trimmed = normalizeWhitespace(input);

  // Validate based on type
  let isValid = false;
  switch (type) {
    case 'email':
      isValid = validateEmail(trimmed);
      break;
    case 'password':
      isValid = validatePassword(trimmed);
      break;
    case 'username':
      isValid = validateUsername(trimmed);
      break;
    case 'title':
      isValid = validateTitle(trimmed);
      break;
    case 'description':
      isValid = validateDescription(trimmed);
      break;
    case 'url':
      isValid = validateUrl(trimmed);
      break;
    default:
      isValid = true; // For unknown types, just sanitize
  }

  if (!isValid) {
    return {
      isValid: false,
      sanitized: '',
      error: `Invalid ${type} format`,
    };
  }

  // Sanitize the input
  const sanitized = sanitizeHtml(trimmed, sanitizeLevel);

  return { isValid: true, sanitized };
}

/**
 * Rate limiting utility (client-side approximation)
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * CSRF protection utility
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;
