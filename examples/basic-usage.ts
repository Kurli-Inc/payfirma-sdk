/**
 * Comprehensive usage example for the Payfirma SDK
 * This example demonstrates all major features of the SDK
 */

import { PayfirmaSDK, PayfirmaError, PaymentError, AuthenticationError } from '../src';

/**
 * Main example function
 */
async function main() {
  // Initialize SDK with sandbox credentials
  const sdk = new PayfirmaSDK({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    sandbox: true,
    timeout: 30000
  });

  try {
    // Step 1: Initialize authentication
    console.log('🔐 Initializing authentication...');
    await sdk.initialize();
    console.log('✅ Authentication successful');

    // Step 2: Customer Management
    console.log('\n👥 Creating customer...');
    const customer = await sdk.customers.createCustomer({
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      company: 'Acme Corporation',
      telephone: '555-123-4567',
      address1: '123 Main Street',
      city: 'Toronto',
      province: 'ON',
      country: 'CA',
      postal_code: 'M5V 3A8',
      custom_id: 'CUSTOMER-001'
    });
    console.log('✅ Customer created:', customer.lookup_id);

    // Step 3: Add card to customer
    console.log('\n💳 Adding card to customer...');
    const card = await sdk.customers.addCard(customer.lookup_id, {
      card_number: '4111111111111111',
      card_expiry_month: 12,
      card_expiry_year: 25,
      cvv2: '123',
      is_default: true,
      card_description: 'Primary Visa Card'
    });
    console.log('✅ Card added:', card.lookup_id);

    // Step 4: Process a quick sale
    console.log('\n💰 Processing quick sale...');
    const quickSale = await sdk.transactions.quickSale(
      25.99,
      '4111111111111111',
      12,
      25,
      '123',
      'CAD'
    );
    console.log('✅ Quick sale processed:', quickSale.id);

    // Step 5: Process sale with customer card
    console.log('\n💳 Processing sale with customer card...');
    const customerSale = await sdk.transactions.saleWithCustomer(
      49.99,
      customer.lookup_id,
      'CAD'
    );
    console.log('✅ Customer sale processed:', customerSale.id);

    // Step 6: Create a subscription plan
    console.log('\n📅 Creating subscription plan...');
    const plan = await sdk.plans.createMonthlyPlan(
      'Premium Monthly Service',
      29.99,
      'CAD',
      12 // 12 payments
    );
    console.log('✅ Plan created:', plan.lookup_id);

    // Step 7: Create subscription for customer
    console.log('\n🔄 Creating subscription...');
    const subscription = await sdk.customers.createSubscription(
      customer.lookup_id,
      {
        plan_lookup_id: plan.lookup_id,
        card_lookup_id: card.lookup_id,
        amount: 29.99,
        start_date: Date.now(),
        email: customer.email,
        description: 'Premium monthly service subscription'
      }
    );
    console.log('✅ Subscription created:', subscription.lookup_id);

    // Step 8: Create an invoice
    console.log('\n📄 Creating invoice...');
    const invoice = await sdk.invoices.createSimpleInvoice(
      'INV-001',
      customer.email,
      [
        {
          description: 'Web Development Services',
          quantity: 10,
          unit_price: 100.00
        },
        {
          description: 'Hosting Services',
          quantity: 1,
          unit_price: 50.00
        }
      ],
      '2024-03-15', // Due date
      {
        taxRate: 13,
        notes: 'Thank you for your business!',
        currency: 'CAD'
      }
    );
    console.log('✅ Invoice created:', invoice.lookup_id);

    // Step 9: Authorization and Capture
    console.log('\n🔒 Creating authorization...');
    const authorization = await sdk.transactions.quickAuthorization(
      75.00,
      '4111111111111111',
      12,
      25,
      '123',
      'CAD'
    );
    console.log('✅ Authorization created:', authorization.id);

    console.log('\n✅ Capturing authorization...');
    const capture = await sdk.transactions.capturePartialAmount(
      authorization.id,
      50.00 // Capture partial amount
    );
    console.log('✅ Capture processed:', capture.id);

    // Step 10: Process a refund
    console.log('\n↩️ Processing refund...');
    const refund = await sdk.transactions.partialRefund(
      quickSale.id,
      10.00,
      'Customer requested partial refund'
    );
    console.log('✅ Refund processed:', refund.id);

    // Step 11: Get transaction summary
    console.log('\n📊 Getting transaction summary...');
    const summary = await sdk.transactions.getTransactionSummary({
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    console.log('✅ Transaction summary:', {
      total_count: summary.total_count,
      total_amount: summary.total_amount,
      currency: summary.currency
    });

    // Step 12: Get customer list
    console.log('\n👥 Getting customer list...');
    const customerList = await sdk.customers.listCustomers({
      limit: 10
    });
    console.log('✅ Found customers:', customerList.entities.length);

    // Step 13: Search transactions
    console.log('\n🔍 Searching transactions...');
    const approvedTransactions = await sdk.transactions.getApprovedTransactions();
    console.log('✅ Approved transactions:', approvedTransactions.length);

    // Step 14: Get plan statistics
    console.log('\n📈 Getting plan statistics...');
    const planStats = await sdk.plans.getPlanStatistics();
    console.log('✅ Plan statistics:', {
      total_plans: planStats.totalPlans,
      active_plans: planStats.activePlans
    });

    // Step 15: EFT Operations (if available)
    try {
      console.log('\n💰 Getting EFT balance...');
      const eftBalance = await sdk.eft.getBalance();
      console.log('✅ EFT balance:', {
        available: eftBalance.available_balance,
        currency: eftBalance.currency
      });
    } catch (error) {
      console.log('ℹ️ EFT service not available in this configuration');
    }

    // Step 16: Authentication status
    console.log('\n🔐 Checking authentication status...');
    const authStatus = sdk.getAuthStatus();
    console.log('✅ Authentication status:', {
      authenticated: authStatus.isAuthenticated,
      token_valid: authStatus.tokenValid
    });

    console.log('\n🎉 All operations completed successfully!');

  } catch (error) {
    console.error('\n❌ Error occurred:', error);
    
    // Specific error handling
    if (error instanceof AuthenticationError) {
      console.error('🔐 Authentication failed. Please check your credentials.');
    } else if (error instanceof PaymentError) {
      console.error('💳 Payment failed:', error.message);
      console.error('Error code:', error.code);
    } else if (error instanceof PayfirmaError) {
      console.error('🚨 Payfirma API error:', error.message);
      console.error('Error code:', error.code);
      console.error('Status:', error.statusCode);
    } else {
      console.error('🔥 Unknown error:', error);
    }
  }
}

/**
 * Advanced usage examples
 */
async function advancedExamples() {
  const sdk = new PayfirmaSDK({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    sandbox: true
  });

  await sdk.initialize();

  // Advanced transaction with full customer information
  console.log('\n🔥 Advanced transaction example...');
  const advancedTransaction = await sdk.transactions.createSale({
    amount: 99.99,
    currency: 'CAD',
    card: {
      card_number: '4111111111111111',
      card_expiry_month: 12,
      card_expiry_year: 25,
      cvv2: '123'
    },
    // Customer information
    email: 'advanced@example.com',
    first_name: 'Advanced',
    last_name: 'Customer',
    company: 'Tech Solutions Inc.',
    telephone: '555-987-6543',
    // Address information
    address1: '456 Tech Street',
    address2: 'Suite 100',
    city: 'Vancouver',
    province: 'BC',
    country: 'CA',
    postal_code: 'V6B 1A1',
    // Order details
    order_id: 'ORDER-ADV-001',
    description: 'Advanced product purchase',
    send_receipt: true,
    // Invoice information
    invoice_info: {
      invoice_number: 'INV-ADV-001',
      po_number: 'PO-12345',
      tax_amount: 13.00,
      shipping_amount: 5.00
    }
  });

  console.log('✅ Advanced transaction:', advancedTransaction.id);

  // Batch operations
  console.log('\n📦 Batch operations example...');
  const batchResults = await Promise.allSettled([
    sdk.customers.searchCustomersByEmail('test@example.com'),
    sdk.transactions.getTransactionsByDateRange('2024-01-01', '2024-12-31'),
    sdk.plans.getActivePlans(),
    sdk.invoices.getPaidInvoices()
  ]);

  batchResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ Batch operation ${index + 1} completed`);
    } else {
      console.log(`❌ Batch operation ${index + 1} failed:`, result.reason);
    }
  });

  // Complex reporting
  console.log('\n📊 Complex reporting example...');
  const [transactionSummary, invoiceSummary] = await Promise.all([
    sdk.transactions.getTransactionSummary({
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'APPROVED'
    }),
    sdk.invoices.getInvoiceSummary({
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    })
  ]);

  console.log('✅ Complex reporting completed');
  console.log('Transaction summary:', transactionSummary);
  console.log('Invoice summary:', invoiceSummary);
}

/**
 * Error handling examples
 */
async function errorHandlingExamples() {
  const sdk = new PayfirmaSDK({
    clientId: 'invalid-client-id',
    clientSecret: 'invalid-client-secret',
    sandbox: true
  });

  // Authentication error example
  try {
    await sdk.initialize();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('🔐 Expected authentication error:', error.message);
    }
  }

  // Payment error example
  const validSDK = new PayfirmaSDK({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    sandbox: true
  });

  await validSDK.initialize();

  try {
    // This will fail due to invalid card number
    await validSDK.transactions.quickSale(
      100.00,
      '4000000000000002', // Declined card
      12,
      25,
      '123',
      'CAD'
    );
  } catch (error) {
    if (error instanceof PaymentError) {
      console.log('💳 Expected payment error:', error.message);
      console.log('Error code:', error.code);
    }
  }
}

// Run examples
if (require.main === module) {
  main()
    .then(() => advancedExamples())
    .then(() => errorHandlingExamples())
    .catch(console.error);
}

export { main, advancedExamples, errorHandlingExamples }; 