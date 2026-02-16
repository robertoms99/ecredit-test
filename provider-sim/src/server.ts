import express from "express";

const app = express();
app.use(express.json());

type Country = "MX" | "CO";

type ProviderRequest = {
  credit_request_id?: string;
  document_id?: string;
  callback_url?: string;
};

const USERS: Record<Country, Array<Record<string, string | number>>> = {
  MX: [
    {
      document_id: "MX-001",
      full_name: "Juan Perez",
      account_status: "active",
      total_debt: 12500,
      average_balance: 8200,
      risk_score: 640
    },
    {
      document_id: "MX-002",
      full_name: "Maria Lopez",
      account_status: "delinquent",
      total_debt: 72000,
      average_balance: 1200,
      risk_score: 520
    },
    {
      document_id: "MX-003",
      full_name: "Carlos Ruiz",
      account_status: "active",
      total_debt: 21000,
      average_balance: 15000,
      risk_score: 710
    }
  ],
  CO: [
    {
      document_id: "CO-001",
      full_name: "Andres Gomez",
      payroll_bank: "Banco Falso",
      total_debt: 9300,
      risk_score: 680
    },
    {
      document_id: "CO-002",
      full_name: "Laura Diaz",
      payroll_bank: "Banco Falso",
      total_debt: 14000,
      risk_score: 730
    },
    {
      document_id: "CO-003",
      full_name: "Sofia Rojas",
      payroll_bank: "Banco Falso",
      total_debt: 4800,
      risk_score: 790
    }
  ]
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function pickUser(country: Country, documentId?: string) {
  const list = USERS[country] || [];
  if (documentId) {
    const match = list.find((u) => u.document_id === documentId);
    if (match) return match;
  }
  return list[Math.floor(Math.random() * list.length)];
}

async function respondLater(payload: ProviderRequest, providerCode: string, country: Country) {
  const delayMs = 2000 + Math.floor(Math.random() * 6000);
  await delay(delayMs);

  const user = pickUser(country, payload.document_id);
  const response = {
    provider: providerCode,
    credit_request_id: payload.credit_request_id,
    customer_reference: `${country}-${payload.document_id}-${Date.now()}`,
    ...user,
    available_credit: Math.max(0, 100000 - (Number(user.total_debt) || 0)),
    risk_level: (Number(user.risk_score) || 0) >= 700 ? "low" : "medium"
  };

  if (!payload.callback_url) {
    return;
  }

  try {
    await fetch(payload.callback_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("Callback failed", message);
  }
}

app.post("/providers/mx", async (req, res) => {
  const payload = req.body as ProviderRequest;
  respondLater(payload, "banco_mexicano", "MX");
  res.json({ status: "accepted", provider: "banco_mexicano" });
});

app.post("/providers/co", async (req, res) => {
  const payload = req.body as ProviderRequest;
  respondLater(payload, "banco_colombiano_falso", "CO");
  res.json({ status: "accepted", provider: "banco_colombiano_falso" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`Provider simulator running on http://localhost:${PORT}`);
});
