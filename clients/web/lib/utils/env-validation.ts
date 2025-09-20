/**
 * Environment variable validation utilities
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Optional but recommended environment variables
 */
const OPTIONAL_ENV_VARS = [
  'OPENROUTER_API_KEY',
  'NEXT_PUBLIC_ENVIRONMENT',
] as const;

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else {
      // Additional validation for specific variables
      if (envVar === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('https://')) {
          errors.push('NEXT_PUBLIC_SUPABASE_URL must start with https://');
        }
      }
      if (envVar.includes('SUPABASE') && envVar.includes('KEY')) {
        if (value.length < 20) {
          warnings.push(`${envVar} seems too short for a valid API key`);
        }
      }
    }
  }

  // Check optional variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      warnings.push(`Missing optional environment variable: ${envVar} - some features may not work`);
    }
  }

  // Environment-specific validations
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';
  if (environment === 'production') {
    if (!process.env.OPENROUTER_API_KEY) {
      errors.push('OPENROUTER_API_KEY is required in production for AI features');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): void {
  const result = validateEnvironment();

  if (!result.isValid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Environment validation passed');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

/**
 * Throws an error if environment validation fails
 */
export function ensureValidEnvironment(): void {
  const result = validateEnvironment();
  if (!result.isValid) {
    const errorMessage = `Environment validation failed:\n${result.errors.join('\n')}`;
    throw new Error(errorMessage);
  }
}
