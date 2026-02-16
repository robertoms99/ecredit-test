import express, { type Request, type Response } from 'express';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

// Test users with predefined profiles
const TEST_USERS = {
  MX: {
    // Good profile - Should be APPROVED
    'GOMC860101HDFRRA09': {
      full_name: 'Good Mexico User',
      credit_score: 750,
      monthly_income: 50000,
      monthly_debt: 15000, // DTI = 30%
      account_balance: 100000,
      employment_status: 'EMPLOYED',
      years_in_job: 5,
    },
    // Bad profile - Should be REJECTED
    'BAPC901215MDFRRS03': {
      full_name: 'Bad Mexico User',
      credit_score: 450, // Below 600 minimum
      monthly_income: 20000,
      monthly_debt: 12000, // DTI = 60%
      account_balance: -5000,
      employment_status: 'UNEMPLOYED',
      years_in_job: 0,
    },
  },
  CO: {
    // Good profile - Should be APPROVED
    '1234567890': {
      full_name: 'Good Colombia User',
      credit_score: 680,
      monthly_income: 5000000,
      monthly_debt: 1500000, // DTI = 30%
      account_balance: 8000000,
      employment_status: 'EMPLOYED',
      years_in_job: 3,
    },
    // Bad profile - Should be REJECTED
    '9876543210': {
      full_name: 'Bad Colombia User',
      credit_score: 400, // Below 550 minimum
      monthly_income: 2000000,
      monthly_debt: 1500000, // DTI = 75%
      account_balance: -100000,
      employment_status: 'SELF_EMPLOYED',
      years_in_job: 1,
    },
  },
};

// In-memory storage for pending requests
interface PendingRequest {
  requestId: string;
  documentId: string;
  creditRequestId: string;
  callbackUrl: string;
  country: 'MX' | 'CO';
  createdAt: Date;
}

const pendingRequests = new Map<string, PendingRequest>();

/**
 * Mexico Provider Endpoint
 * POST /providers/mx
 */
app.post('/providers/mx', (req: Request, res: Response) => {
  const { document_id, credit_request_id, callback_url } = req.body;

  if (!document_id || !credit_request_id || !callback_url) {
    return res.status(400).json({
      error: 'Missing required fields: document_id, credit_request_id, callback_url',
    });
  }

  // Validate document exists in test users
  if (!TEST_USERS.MX[document_id as keyof typeof TEST_USERS.MX]) {
    return res.status(404).json({
      error: `Document ID ${document_id} not found in Mexico test users`,
      available_test_users: Object.keys(TEST_USERS.MX),
    });
  }

  // Generate external request ID (UUID as real providers would)
  const requestId = randomUUID();

  // Store pending request
  pendingRequests.set(requestId, {
    requestId,
    documentId: document_id,
    creditRequestId: credit_request_id,
    callbackUrl: callback_url,
    country: 'MX',
    createdAt: new Date(),
  });

  console.log(`[MX Provider] Received request for CURP: ${document_id}`);
  console.log(`[MX Provider] Generated external request ID: ${requestId}`);
  console.log(`[MX Provider] Will callback to: ${callback_url}`);

  // Simulate async processing (2-8 seconds delay)
  const delay = Math.floor(Math.random() * 6000) + 2000;
  setTimeout(() => {
    processCallback(requestId);
  }, delay);

  // Respond immediately with request ID
  res.status(202).json({
    request_id: requestId,
    status: 'PENDING',
    message: 'Request accepted, data will be sent to callback URL',
    estimated_time_seconds: Math.floor(delay / 1000),
  });
});

/**
 * Colombia Provider Endpoint
 * POST /providers/co
 */
app.post('/providers/co', (req: Request, res: Response) => {
  const { document_id, credit_request_id, callback_url } = req.body;

  if (!document_id || !credit_request_id || !callback_url) {
    return res.status(400).json({
      error: 'Missing required fields: document_id, credit_request_id, callback_url',
    });
  }

  // Validate document exists in test users
  if (!TEST_USERS.CO[document_id as keyof typeof TEST_USERS.CO]) {
    return res.status(404).json({
      error: `Document ID ${document_id} not found in Colombia test users`,
      available_test_users: Object.keys(TEST_USERS.CO),
    });
  }

  // Generate external request ID (UUID as real providers would)
  const requestId = randomUUID();

  // Store pending request
  pendingRequests.set(requestId, {
    requestId,
    documentId: document_id,
    creditRequestId: credit_request_id,
    callbackUrl: callback_url,
    country: 'CO',
    createdAt: new Date(),
  });

  console.log(`[CO Provider] Received request for CC: ${document_id}`);
  console.log(`[CO Provider] Generated external request ID: ${requestId}`);
  console.log(`[CO Provider] Will callback to: ${callback_url}`);

  // Simulate async processing (2-8 seconds delay)
  const delay = Math.floor(Math.random() * 6000) + 2000;
  setTimeout(() => {
    processCallback(requestId);
  }, delay);

  // Respond immediately with request ID
  res.status(202).json({
    request_id: requestId,
    status: 'PENDING',
    message: 'Request accepted, data will be sent to callback URL',
    estimated_time_seconds: Math.floor(delay / 1000),
  });
});

/**
 * Process callback - sends financial data to the application's webhook
 */
async function processCallback(requestId: string) {
  const request = pendingRequests.get(requestId);
  if (!request) {
    console.error(`[Provider] Request ${requestId} not found in pending requests`);
    return;
  }

  const userProfile =
    request.country === 'MX'
      ? TEST_USERS.MX[request.documentId as keyof typeof TEST_USERS.MX]
      : TEST_USERS.CO[request.documentId as keyof typeof TEST_USERS.CO];

  if (!userProfile) {
    console.error(
      `[Provider] User profile not found for ${request.documentId} in country ${request.country}`
    );
    return;
  }

  const payload = {
    request_id: requestId,
    document_id: request.documentId,
    full_name: userProfile.full_name,
    credit_score: userProfile.credit_score,
    monthly_income: userProfile.monthly_income,
    monthly_debt: userProfile.monthly_debt,
    account_balance: userProfile.account_balance,
    employment_status: userProfile.employment_status,
    years_in_job: userProfile.years_in_job,
    timestamp: new Date().toISOString(),
  };

  console.log(`\n[${request.country} Provider] Sending callback for request ${requestId}`);
  console.log(`[${request.country} Provider] Document: ${request.documentId}`);
  console.log(`[${request.country} Provider] Profile: ${userProfile.full_name}`);
  console.log(`[${request.country} Provider] Credit Score: ${userProfile.credit_score}`);
  console.log(`[${request.country} Provider] Callback URL: ${request.callbackUrl}`);

  try {
    const response = await fetch(request.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[${request.country} Provider] ✓ Callback successful (status ${response.status})`);
      pendingRequests.delete(requestId);
    } else {
      const text = await response.text();
      console.error(
        `[${request.country} Provider] ✗ Callback failed (status ${response.status}): ${text}`
      );
    }
  } catch (error: any) {
    console.error(`[${request.country} Provider] ✗ Callback error: ${error.message}`);
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Provider Simulator',
    uptime: process.uptime(),
    pending_requests: pendingRequests.size,
    test_users: {
      MX: Object.keys(TEST_USERS.MX),
      CO: Object.keys(TEST_USERS.CO),
    },
  });
});

/**
 * List test users endpoint (for debugging)
 */
app.get('/test-users', (_req: Request, res: Response) => {
  res.json({
    mexico: Object.entries(TEST_USERS.MX).map(([documentId, profile]) => ({
      document_id: documentId,
      full_name: profile.full_name,
      credit_score: profile.credit_score,
      expected_result: profile.credit_score >= 600 ? 'APPROVED' : 'REJECTED',
    })),
    colombia: Object.entries(TEST_USERS.CO).map(([documentId, profile]) => ({
      document_id: documentId,
      full_name: profile.full_name,
      credit_score: profile.credit_score,
      expected_result: profile.credit_score >= 550 ? 'APPROVED' : 'REJECTED',
    })),
  });
});

const PORT = process.env.PROVIDER_SIM_PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Provider Simulator running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/providers/mx - Mexico provider`);
  console.log(`   POST http://localhost:${PORT}/providers/co - Colombia provider`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  console.log(`   GET  http://localhost:${PORT}/test-users - List test users`);
  console.log(`\n👥 Test Users:`);
  console.log(`   MX (Mexico):`);
  Object.entries(TEST_USERS.MX).forEach(([id, profile]) => {
    console.log(`      ${id} - ${profile.full_name} (Score: ${profile.credit_score})`);
  });
  console.log(`   CO (Colombia):`);
  Object.entries(TEST_USERS.CO).forEach(([id, profile]) => {
    console.log(`      ${id} - ${profile.full_name} (Score: ${profile.credit_score})`);
  });
  console.log('');
});
