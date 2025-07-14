/**
 * Utility functions for transforming data between camelCase and snake_case
 */

/**
 * Converts a string from camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts a string from snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively converts object keys from camelCase to snake_case
 */
export function transformKeysToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnake);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    transformed[snakeKey] = transformKeysToSnake(value);
  }

  return transformed;
}

/**
 * Recursively converts object keys from snake_case to camelCase
 */
export function transformKeysToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeysToCamel);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    transformed[camelKey] = transformKeysToCamel(value);
  }

  return transformed;
}

/**
 * Axios request transformer - converts camelCase to snake_case
 */
export function requestTransformer(data: any): any {
  if (!data) return data;

  // If data is a string (JSON), parse it first
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  return JSON.stringify(transformKeysToSnake(data));
}

/**
 * Axios response transformer - converts snake_case to camelCase
 */
export function responseTransformer(data: any): any {
  if (!data) return data;

  // If data is a string, parse it first
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  return transformKeysToCamel(data);
}
