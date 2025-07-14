# Payfirma SDK for TypeScript/JavaScript

A comprehensive TypeScript SDK for the Payfirma payment processing API. This SDK provides a complete, type-safe interface for all Payfirma API services including payments, customer management, recurring billing, invoicing, and more.

## Features

- 🔐 **OAuth 2.0 Authentication** - Secure authentication with automatic token refresh
- 💳 **Payment Processing** - Sales, authorizations, captures, and refunds
- 👥 **Customer Management** - Store customer information and payment methods securely
- 🔄 **Recurring Billing** - Create and manage subscription plans
- 📄 **Invoice Management** - Generate, send, and track invoices
- 🏪 **Terminal Support** - Physical card terminal integration
- 💰 **EFT Support** - Electronic funds transfer capabilities
- 📊 **Comprehensive Reporting** - Transaction analytics and summaries
- 🛡️ **Type Safety** - Full TypeScript support with detailed type definitions
- 🐪 **camelCase Transformers** - Write JavaScript-friendly camelCase, automatically converted to API's snake_case
- 🌐 **Environment Support** - Both sandbox and production environments
- 📚 **Well Documented** - Extensive JSDoc comments and examples

## Installation

```bash
npm install payfirma-sdk
```

## Quick Start

```typescript
import { PayfirmaSDK } from 'payfirma-sdk';

// Create SDK instance
const sdk = new PayfirmaSDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  sandbox: true, // Use sandbox for testing
});

// Initialize authentication
await sdk.initialize();

// Process a payment
const transaction = await sdk.transactions.quickSale(
  10.99, // amount
  '4111111111111111', // card number
  12, // expiry month
  25, // expiry year
  '123', // CVV
  'CAD' // currency
);

console.log('Transaction successful:', transaction.id);
```

## Configuration

### Basic Configuration

```typescript
const sdk = new PayfirmaSDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  sandbox: true, // Optional: defaults to false
  timeout: 30000, // Optional: request timeout in ms
});
```

### Environment-Specific Setup

```typescript
// Sandbox environment
const sandboxSDK = PayfirmaSDK.createSandbox('client-id', 'client-secret');

// Production environment
const productionSDK = PayfirmaSDK.createProduction(
  'client-id',
  'client-secret'
);
```

### Custom API URLs

```typescript
const sdk = new PayfirmaSDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiUrls: {
    auth: 'https://custom-auth.example.com',
    gateway: 'https://custom-gateway.example.com',
  },
});
```

## camelCase Transformers

The SDK automatically converts between JavaScript-friendly camelCase and the API's snake_case format. You can write all your code using standard JavaScript conventions, and the SDK handles the conversion seamlessly.

### How it Works

- **Requests**: camelCase properties are automatically converted to snake_case before being sent to the API
- **Responses**: snake_case properties from the API are automatically converted to camelCase in your code
- **Nested Objects**: Deep transformation works with nested objects and arrays
- **Bi-directional**: Supports both request and response transformations

### Example

```typescript
// You write JavaScript-friendly camelCase
const customer = await sdk.customers.createCustomer({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john@example.com',
  billingAddress: {
    address1: '123 Main St',
    postalCode: '12345',
    phoneNumber: '555-1234',
  },
});

// SDK automatically converts to snake_case for API:
// {
//   first_name: 'John',
//   last_name: 'Doe',
//   email_address: 'john@example.com',
//   billing_address: {
//     address1: '123 Main St',
//     postal_code: '12345',
//     phone_number: '555-1234'
//   }
// }

// Response comes back as camelCase
console.log(customer.firstName); // 'John'
console.log(customer.lookupId); // 'cust_abc123'
```

### Supported Transformations

- `firstName` ↔ `first_name`
- `lastName` ↔ `last_name`
- `emailAddress` ↔ `email_address`
- `cardNumber` ↔ `card_number`
- `expiryMonth` ↔ `expiry_month`
- `customerLookupId` ↔ `customer_lookup_id`
- `postalCode` ↔ `postal_code`
- And many more...

The transformation handles all common JavaScript naming patterns automatically.

### Manual Transformers

If you need to manually transform data (e.g., for custom API calls), you can import the transformer functions:

```typescript
import {
  transformKeysToSnake,
  transformKeysToCamel,
} from 'payfirma-sdk/transformers';

// Convert camelCase to snake_case
const snakeCase = transformKeysToSnake({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john@example.com',
});
// Result: { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' }

// Convert snake_case to camelCase
const camelCase = transformKeysToCamel({
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john@example.com',
});
// Result: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' }
```

## Authentication

### Client Credentials Flow (Recommended)

```typescript
const sdk = new PayfirmaSDK(config);
await sdk.initialize(); // Automatically handles authentication
```

### OAuth 2.0 Authorization Code Flow

```typescript
// Generate authorization URL
const authUrl = sdk.getAuthorizationUrl(
  'https://your-app.com/callback',
  'state-parameter', // Optional
  ['ecom', 'invoice'] // Optional scopes
);

// After user authorizes, exchange code for token
await sdk.exchangeCodeForToken(
  authorizationCode,
  'https://your-app.com/callback',
  'state-parameter'
);
```

### Manual Token Management

```typescript
// Set custom credentials
sdk.setCredentials(
  'access-token',
  'refresh-token', // Optional
  1234567890 // Optional expiry timestamp
);

// Check authentication status
const status = sdk.getAuthStatus();
console.log('Authenticated:', status.isAuthenticated);
console.log('Token valid:', status.tokenValid);
```

## Payment Processing

### Simple Sales

```typescript
// Quick sale with card details
const transaction = await sdk.transactions.quickSale(
  100.0,
  '4111111111111111',
  12,
  25,
  '123',
  'CAD'
);

// Sale with encrypted token
const tokenTransaction = await sdk.transactions.saleWithToken(
  100.0,
  'encrypted-card-token',
  'USD'
);
```

### Advanced Sale Options

```typescript
const transaction = await sdk.transactions.createSale({
  amount: 100.0,
  currency: 'CAD',
  card: {
    cardNumber: '4111111111111111',
    cardExpiryMonth: 12,
    cardExpiryYear: 25,
    cvv2: '123',
  },
  // Customer information
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  // Billing information
  address1: '123 Main St',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  postalCode: 'M5V 3A8',
  // Order details
  orderId: 'ORDER-123',
  description: 'Product purchase',
  sendReceipt: true,
});
```

### Authorization and Capture

```typescript
// Create authorization (hold funds)
const auth = await sdk.transactions.quickAuthorization(
  100.0,
  '4111111111111111',
  12,
  25,
  '123'
);

// Capture the full amount
const capture = await sdk.transactions.captureFullAmount(auth.id);

// Or capture partial amount
const partialCapture = await sdk.transactions.capturePartialAmount(
  auth.id,
  50.0
);
```

### Refunds

```typescript
// Full refund
const refund = await sdk.transactions.fullRefund(transactionId);

// Partial refund
const partialRefund = await sdk.transactions.partialRefund(
  transactionId,
  25.0,
  'Customer requested partial refund'
);
```

## Customer Management

### Creating Customers

```typescript
const customer = await sdk.customers.createCustomer({
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Acme Corp',
  telephone: '555-123-4567',
  address1: '123 Main St',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  postalCode: 'M5V 3A8',
  customId: 'CUSTOMER-123',
});
```

### Managing Customer Cards

```typescript
// Add a card to customer
const card = await sdk.customers.addCard(customer.lookupId, {
  cardNumber: '4111111111111111',
  cardExpiryMonth: 12,
  cardExpiryYear: 25,
  cvv2: '123',
  isDefault: true,
  cardDescription: 'Primary Visa',
});

// Charge customer's default card
const payment = await sdk.customers.chargeDefaultCard(
  customer.lookupId,
  100.0,
  'CAD'
);

// Charge specific card
const specificCardPayment = await sdk.customers.chargeCard(
  customer.lookupId,
  card.lookupId,
  50.0,
  'CAD'
);
```

### Customer Search

```typescript
// Search by email
const customers = await sdk.customers.searchCustomersByEmail(
  'customer@example.com'
);

// Search by name
const namedCustomers = await sdk.customers.searchCustomersByName('John', 'Doe');

// Get customers with subscriptions
const subscribedCustomers = await sdk.customers.getCustomersWithSubscriptions();
```

## Recurring Billing

### Creating Plans

```typescript
// Create a monthly plan
const plan = await sdk.plans.createMonthlyPlan(
  'Monthly Premium',
  29.99,
  'CAD',
  12 // 12 payments (optional)
);

// Create custom plan
const customPlan = await sdk.plans.createPlan({
  name: 'Weekly Service',
  amount: 9.99,
  currency: 'CAD',
  frequency: 'WEEKLY',
  numberOfPayments: 52,
  sendReceipt: true,
  description: 'Weekly service subscription',
});
```

### Managing Subscriptions

```typescript
// Create subscription for customer
const subscription = await sdk.customers.createSubscription(customer.lookupId, {
  planLookupId: plan.lookupId,
  cardLookupId: card.lookupId,
  amount: 29.99, // Can override plan amount
  startDate: Date.now(),
  email: 'customer@example.com',
  description: 'Premium subscription',
});

// Update subscription
const updatedSubscription = await sdk.customers.updateSubscription(
  customer.lookupId,
  subscription.lookupId,
  {
    amount: 39.99,
    status: 'ACTIVE',
  }
);

// Cancel subscription
await sdk.customers.cancelSubscription(
  customer.lookupId,
  subscription.lookupId
);
```

## Invoice Management

### Creating Invoices

```typescript
// Simple invoice
const invoice = await sdk.invoices.createSimpleInvoice(
  'INV-001',
  'customer@example.com',
  [
    {
      description: 'Web Development',
      quantity: 10,
      unitPrice: 100.0,
    },
    {
      description: 'Hosting',
      quantity: 1,
      unitPrice: 50.0,
    },
  ],
  '2024-02-15', // Due date
  {
    taxRate: 13, // 13% tax
    notes: 'Thanks for your business!',
  }
);

// Advanced invoice
const advancedInvoice = await sdk.invoices.createInvoice({
  invoiceNumber: 'INV-002',
  dueDate: '2024-02-15',
  items: [
    {
      description: 'Consulting Services',
      quantity: 5,
      unitPrice: 150.0,
      totalAmount: 750.0,
    },
  ],
  currency: 'CAD',
  taxRate: 13,
  discountAmount: 50.0,
  shippingAmount: 25.0,
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  notes: 'Payment terms: Net 30',
});
```

### Invoice Operations

```typescript
// Send invoice email
await sdk.invoices.sendInvoiceToEmail(
  invoice.lookupId,
  'customer@example.com',
  'Your Invoice is Ready',
  'Please find your invoice attached.'
);

// Mark as paid
await sdk.invoices.markInvoiceAsPaid(invoice.lookupId);

// Get invoice analytics
const summary = await sdk.invoices.getInvoiceSummary({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

## Terminal Integration

### Terminal Operations

```typescript
// Process terminal sale
const terminalSale = await sdk.terminals.quickSale('TERMINAL-001', 50.0, 'CAD');

// Process refund
const terminalRefund = await sdk.terminals.quickRefund(
  'TERMINAL-001',
  terminalSale.id,
  50.0
);

// Check terminal status
const isOnline = await sdk.terminals.isTerminalOnline('TERMINAL-001');
```

## Electronic Funds Transfer (EFT)

### EFT Operations

```typescript
// Check account balance
const balance = await sdk.eft.getBalance();

// Process debit (incoming funds)
const debit = await sdk.eft.quickDebit(
  1000.0,
  '1234567890',
  '123456789',
  'John Doe',
  'CAD'
);

// Process credit (outgoing funds)
const credit = await sdk.eft.quickCredit(
  500.0,
  '1234567890',
  '123456789',
  'John Doe',
  'CAD'
);

// Get account summary
const summary = await sdk.eft.getAccountSummary();
```

## Reporting and Analytics

### Transaction Reporting

```typescript
// Get transaction summary
const summary = await sdk.transactions.getTransactionSummary({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'APPROVED',
});

// Daily volume
const dailyVolume = await sdk.transactions.getDailyVolume('2024-01-15');

// Search transactions
const transactions = await sdk.transactions.getTransactionsByDateRange(
  '2024-01-01',
  '2024-01-31'
);
```

### Plan Analytics

```typescript
// Plan statistics
const planStats = await sdk.plans.getPlanStatistics();

// Monthly invoice stats
const monthlyStats = await sdk.invoices.getMonthlyInvoiceStats(2024, 1);
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import {
  PayfirmaError,
  AuthenticationError,
  PaymentError,
  ValidationError,
  NetworkError,
} from 'payfirma-sdk';

try {
  const transaction = await sdk.transactions.quickSale(/* ... */);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
    // Handle authentication issues
  } else if (error instanceof PaymentError) {
    console.error('Payment failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Details:', error.details);
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    // Handle validation issues
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Handle network issues
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import {
  PayfirmaSDK,
  Transaction,
  Customer,
  Plan,
  Invoice,
} from 'payfirma-sdk';

// All responses are properly typed with camelCase properties
const customer: Customer = await sdk.customers.createCustomer({
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
});

// TypeScript will catch errors at compile time
const transaction: Transaction = await sdk.transactions.createSale({
  amount: 100.0,
  currency: 'CAD', // TypeScript knows this should be 'CAD' | 'USD'
  card: {
    cardNumber: '4111111111111111',
    cardExpiryMonth: 12,
    cardExpiryYear: 25,
    cvv2: '123',
  },
  firstName: 'John',
  sendReceipt: true,
  // ... other properties
});

// Access response properties with camelCase
console.log(transaction.id); // Transaction ID
console.log(transaction.customerId); // Customer ID (if available)
console.log(customer.lookupId); // Customer lookup ID
```

### Type Definitions Note

The TypeScript type definitions show snake_case properties (matching the Payfirma API), but you should use camelCase in your actual code. The SDK's transformers automatically handle the conversion:

```typescript
// TypeScript definition shows snake_case:
interface CreateCustomerRequest {
  first_name?: string;
  last_name?: string;
  email_address?: string;
  // ...
}

// But write your code using camelCase:
const customer = await sdk.customers.createCustomer({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john@example.com',
  // ...
});
```

This approach ensures type safety while providing a JavaScript-friendly developer experience.

## Testing

The SDK includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/payfirma/payfirma-sdk-typescript.git

# Install dependencies
npm install

# Build the SDK
npm run build

# Run in development mode
npm run dev
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@payfirma.com
- 📞 Phone: 1-800-747-6883
- 📚 Documentation: https://developer.payfirma.com
- 🐛 Issues: https://github.com/payfirma/payfirma-sdk-typescript/issues

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details about changes in each version.

---

**Note**: This SDK is designed to work with the Payfirma API. Make sure you have valid API credentials and appropriate permissions for the operations you want to perform.

For sandbox testing, use the test card numbers provided in the [Payfirma API documentation](https://developer.payfirma.com).
