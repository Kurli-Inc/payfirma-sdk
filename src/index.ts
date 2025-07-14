/**
 * Payfirma SDK for TypeScript/JavaScript
 * 
 * Complete payment processing solution with OAuth 2.0 authentication,
 * customer management, recurring billing, and transaction processing.
 * 
 * @example
 * ```typescript
 * import { PayfirmaSDK } from 'payfirma-sdk';
 * 
 * const sdk = new PayfirmaSDK({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   sandbox: true
 * });
 * ```
 */

export * from './PayfirmaSDK';
export * from './types';
export * from './errors';
export * from './services'; 