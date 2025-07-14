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
  sandbox: true // Use sandbox for testing
});

// Initialize authentication
await sdk.initialize();

// Process a payment
const transaction = await sdk.transactions.quickSale(
  10.99,           // amount
  '4111111111111111', // card number
  12,              // expiry month
  25,              // expiry year
  '123',           // CVV
  'CAD'           // currency
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
  timeout: 30000 // Optional: request timeout in ms
});
```

### Environment-Specific Setup

```typescript
// Sandbox environment
const sandboxSDK = PayfirmaSDK.createSandbox('client-id', 'client-secret');

// Production environment
const productionSDK = PayfirmaSDK.createProduction('client-id', 'client-secret');
```

### Custom API URLs

```typescript
const sdk = new PayfirmaSDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiUrls: {
    auth: 'https://custom-auth.example.com',
    gateway: 'https://custom-gateway.example.com'
  }
});
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
  100.00,
  '4111111111111111',
  12,
  25,
  '123',
  'CAD'
);

// Sale with encrypted token
const tokenTransaction = await sdk.transactions.saleWithToken(
  100.00,
  'encrypted-card-token',
  'USD'
);
```

### Advanced Sale Options

```typescript
const transaction = await sdk.transactions.createSale({
  amount: 100.00,
  currency: 'CAD',
  card: {
    card_number: '4111111111111111',
    card_expiry_month: 12,
    card_expiry_year: 25,
    cvv2: '123'
  },
  // Customer information
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe',
  // Billing information
  address1: '123 Main St',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  postal_code: 'M5V 3A8',
  // Order details
  order_id: 'ORDER-123',
  description: 'Product purchase',
  send_receipt: true
});
```

### Authorization and Capture

```typescript
// Create authorization (hold funds)
const auth = await sdk.transactions.quickAuthorization(
  100.00,
  '4111111111111111',
  12,
  25,
  '123'
);

// Capture the full amount
const capture = await sdk.transactions.captureFullAmount(auth.id);

// Or capture partial amount
const partialCapture = await sdk.transactions.capturePartialAmount(auth.id, 50.00);
```

### Refunds

```typescript
// Full refund
const refund = await sdk.transactions.fullRefund(transactionId);

// Partial refund
const partialRefund = await sdk.transactions.partialRefund(
  transactionId,
  25.00,
  'Customer requested partial refund'
);
```

## Customer Management

### Creating Customers

```typescript
const customer = await sdk.customers.createCustomer({
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe',
  company: 'Acme Corp',
  telephone: '555-123-4567',
  address1: '123 Main St',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  postal_code: 'M5V 3A8',
  custom_id: 'CUSTOMER-123'
});
```

### Managing Customer Cards

```typescript
// Add a card to customer
const card = await sdk.customers.addCard(customer.lookup_id, {
  card_number: '4111111111111111',
  card_expiry_month: 12,
  card_expiry_year: 25,
  cvv2: '123',
  is_default: true,
  card_description: 'Primary Visa'
});

// Charge customer's default card
const payment = await sdk.customers.chargeDefaultCard(
  customer.lookup_id,
  100.00,
  'CAD'
);

// Charge specific card
const specificCardPayment = await sdk.customers.chargeCard(
  customer.lookup_id,
  card.lookup_id,
  50.00,
  'CAD'
);
```

### Customer Search

```typescript
// Search by email
const customers = await sdk.customers.searchCustomersByEmail('customer@example.com');

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
  number_of_payments: 52,
  send_receipt: true,
  description: 'Weekly service subscription'
});
```

### Managing Subscriptions

```typescript
// Create subscription for customer
const subscription = await sdk.customers.createSubscription(
  customer.lookup_id,
  {
    plan_lookup_id: plan.lookup_id,
    card_lookup_id: card.lookup_id,
    amount: 29.99, // Can override plan amount
    start_date: Date.now(),
    email: 'customer@example.com',
    description: 'Premium subscription'
  }
);

// Update subscription
const updatedSubscription = await sdk.customers.updateSubscription(
  customer.lookup_id,
  subscription.lookup_id,
  {
    amount: 39.99,
    status: 'ACTIVE'
  }
);

// Cancel subscription
await sdk.customers.cancelSubscription(
  customer.lookup_id,
  subscription.lookup_id
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
      unit_price: 100.00
    },
    {
      description: 'Hosting',
      quantity: 1,
      unit_price: 50.00
    }
  ],
  '2024-02-15', // Due date
  {
    taxRate: 13, // 13% tax
    notes: 'Thanks for your business!'
  }
);

// Advanced invoice
const advancedInvoice = await sdk.invoices.createInvoice({
  invoice_number: 'INV-002',
  due_date: '2024-02-15',
  items: [
    {
      description: 'Consulting Services',
      quantity: 5,
      unit_price: 150.00,
      total_amount: 750.00
    }
  ],
  currency: 'CAD',
  tax_rate: 13,
  discount_amount: 50.00,
  shipping_amount: 25.00,
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe',
  notes: 'Payment terms: Net 30'
});
```

### Invoice Operations

```typescript
// Send invoice email
await sdk.invoices.sendInvoiceToEmail(
  invoice.lookup_id,
  'customer@example.com',
  'Your Invoice is Ready',
  'Please find your invoice attached.'
);

// Mark as paid
await sdk.invoices.markInvoiceAsPaid(invoice.lookup_id);

// Get invoice analytics
const summary = await sdk.invoices.getInvoiceSummary({
  start_date: '2024-01-01',
  end_date: '2024-12-31'
});
```

## Terminal Integration

### Terminal Operations

```typescript
// Process terminal sale
const terminalSale = await sdk.terminals.quickSale(
  'TERMINAL-001',
  50.00,
  'CAD'
);

// Process refund
const terminalRefund = await sdk.terminals.quickRefund(
  'TERMINAL-001',
  terminalSale.id,
  50.00
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
  1000.00,
  '1234567890',
  '123456789',
  'John Doe',
  'CAD'
);

// Process credit (outgoing funds)
const credit = await sdk.eft.quickCredit(
  500.00,
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
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  status: 'APPROVED'
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
  NetworkError 
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
  Invoice 
} from 'payfirma-sdk';

// All responses are properly typed
const customer: Customer = await sdk.customers.createCustomer({
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

// TypeScript will catch errors at compile time
const transaction: Transaction = await sdk.transactions.createSale({
  amount: 100.00,
  currency: 'CAD', // TypeScript knows this should be 'CAD' | 'USD'
  // ... other properties
});
```

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