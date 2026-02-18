import express, { type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { randomUUID } from 'crypto';
import { openApiSpec } from './openapi';

const app = express();
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec as swaggerUi.JsonObject));

const TEST_USERS = {
  MX: {
    'GOMC860101HDFRRA09': {
      nombre_completo: 'Good Mexico User',
      calificacion_buro: 750,
      ingreso_mensual_mxn: 50000,
      deuda_mensual_mxn: 15000,
      saldo_cuenta_mxn: 100000,
      estatus_laboral: 'EMPLEADO_FORMAL',
      antiguedad_laboral_meses: 60,
      tiene_vivienda_propia: true,
      numero_tarjetas_credito: 2,
      historial_pagos_ultimos_12_meses: 'EXCELENTE',
    },
    'BAPC901215MDFRRS03': {
      nombre_completo: 'Bad Mexico User',
      calificacion_buro: 450,
      ingreso_mensual_mxn: 20000,
      deuda_mensual_mxn: 12000,
      saldo_cuenta_mxn: -5000,
      estatus_laboral: 'DESEMPLEADO',
      antiguedad_laboral_meses: 0,
      tiene_vivienda_propia: false,
      numero_tarjetas_credito: 0,
      historial_pagos_ultimos_12_meses: 'MALO',
    },
  },
  CO: {
    '1234567890': {
      nombre: 'Good Colombia User',
      score_datacredito: 680,
      ingresos_mensuales: 5000000,
      obligaciones_mensuales: 1500000,
      balance_cuentas: 8000000,
      tipo_contrato: 'INDEFINIDO',
      meses_antiguedad_trabajo: 36,
      propietario_vivienda: 'SI',
      cantidad_creditos_activos: 1,
      comportamiento_pago: 'AL_DIA',
      categoria_riesgo: 'A',
    },
    '9876543210': {
      nombre: 'Bad Colombia User',
      score_datacredito: 400,
      ingresos_mensuales: 2000000,
      obligaciones_mensuales: 1500000,
      balance_cuentas: -100000,
      tipo_contrato: 'PRESTACION_SERVICIOS',
      meses_antiguedad_trabajo: 12,
      propietario_vivienda: 'NO',
      cantidad_creditos_activos: 4,
      comportamiento_pago: 'MORA_MAYOR_60_DIAS',
      categoria_riesgo: 'D',
    },
  },
};

interface PendingRequest {
  correlationId: string;
  documentId: string;
  creditRequestId: string;
  callbackUrl: string;
  country: 'MX' | 'CO';
  createdAt: Date;
}

const pendingRequests = new Map<string, PendingRequest>();

app.post('/providers/mx', (req: Request, res: Response) => {
  const { document_id, credit_request_id, callback_url } = req.body;

  if (!document_id || !credit_request_id || !callback_url) {
    return res.status(400).json({
      error: 'Missing required fields: document_id, credit_request_id, callback_url',
    });
  }

  if (!TEST_USERS.MX[document_id as keyof typeof TEST_USERS.MX]) {
    return res.status(404).json({
      error_code: 'USER_NOT_FOUND',
      error: 'CURP no encontrado en el sistema',
      details: {
        document_id,
        country: 'MX',
      },
    });
  }

  const correlationId = randomUUID();

  pendingRequests.set(correlationId, {
    correlationId,
    documentId: document_id,
    creditRequestId: credit_request_id,
    callbackUrl: callback_url,
    country: 'MX',
    createdAt: new Date(),
  });

  console.log(`[MX Provider] Received request for CURP: ${document_id}`);
  console.log(`[MX Provider] Generated external correlation ID: ${correlationId}`);
  console.log(`[MX Provider] Will callback to: ${callback_url}`);

  const delay = Math.floor(Math.random() * 6000) + 2000;
  setTimeout(() => {
    processCallback(correlationId);
  }, delay);

  res.status(202).json({
    correlation_id: correlationId,
    status: 'PENDING',
    message: 'Solicitud aceptada, los datos se enviarán al webhook',
    estimated_time_seconds: Math.floor(delay / 1000),
  });
});

app.post('/providers/co', (req: Request, res: Response) => {
  const { document_id, credit_request_id, callback_url } = req.body;

  if (!document_id || !credit_request_id || !callback_url) {
    return res.status(400).json({
      error: 'Missing required fields: document_id, credit_request_id, callback_url',
    });
  }

  if (!TEST_USERS.CO[document_id as keyof typeof TEST_USERS.CO]) {
    return res.status(404).json({
      error_code: 'USER_NOT_FOUND',
      error: 'Cédula no encontrada en el sistema',
      details: {
        document_id,
        country: 'CO',
      },
    });
  }

  const correlationId = randomUUID();

  pendingRequests.set(correlationId, {
    correlationId,
    documentId: document_id,
    creditRequestId: credit_request_id,
    callbackUrl: callback_url,
    country: 'CO',
    createdAt: new Date(),
  });

  console.log(`[CO Provider] Received request for CC: ${document_id}`);
  console.log(`[CO Provider] Generated external correlation ID: ${correlationId}`);
  console.log(`[CO Provider] Will callback to: ${callback_url}`);

  const delay = Math.floor(Math.random() * 6000) + 2000;
  setTimeout(() => {
    processCallback(correlationId);
  }, delay);

  res.status(202).json({
    correlation_id: correlationId,
    status: 'PENDING',
    message: 'Solicitud aceptada, los datos se enviarán al webhook',
    estimated_time_seconds: Math.floor(delay / 1000),
  });
});

async function processCallback(correlationId: string) {
  const request = pendingRequests.get(correlationId);
  if (!request) {
    console.error(`[Provider] Request correlation ${correlationId} not found in pending requests`);
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

  let payload: any;

  if (request.country === 'MX') {
    const mxProfile = userProfile as typeof TEST_USERS.MX[keyof typeof TEST_USERS.MX];
    payload = {
      correlation_id: correlationId,
      curp: request.documentId,
      datos_personales: {
        nombre_completo: mxProfile.nombre_completo,
      },
      informacion_crediticia: {
        calificacion_buro: mxProfile.calificacion_buro,
        historial_pagos: mxProfile.historial_pagos_ultimos_12_meses,
      },
      informacion_financiera: {
        ingreso_mensual_mxn: mxProfile.ingreso_mensual_mxn,
        deuda_mensual_mxn: mxProfile.deuda_mensual_mxn,
        saldo_cuenta_mxn: mxProfile.saldo_cuenta_mxn,
      },
      informacion_laboral: {
        estatus: mxProfile.estatus_laboral,
        antiguedad_meses: mxProfile.antiguedad_laboral_meses,
      },
      informacion_adicional: {
        tiene_vivienda_propia: mxProfile.tiene_vivienda_propia,
        numero_tarjetas_credito: mxProfile.numero_tarjetas_credito,
      },
      metadata: {
        proveedor: 'Buró de Crédito México',
        fecha_consulta: new Date().toISOString(),
        version_api: '2.0',
      },
    };
  } else {
    const coProfile = userProfile as typeof TEST_USERS.CO[keyof typeof TEST_USERS.CO];
    payload = {
      correlation_id: correlationId,
      cedula: request.documentId,
      informacion_basica: {
        nombre: coProfile.nombre,
      },
      datacredito: {
        score: coProfile.score_datacredito,
        categoria_riesgo: coProfile.categoria_riesgo,
        comportamiento_pago: coProfile.comportamiento_pago,
      },
      datos_financieros: {
        ingresos_mensuales: coProfile.ingresos_mensuales,
        obligaciones_mensuales: coProfile.obligaciones_mensuales,
        balance_cuentas: coProfile.balance_cuentas,
        cantidad_creditos_activos: coProfile.cantidad_creditos_activos,
      },
      informacion_empleo: {
        tipo_contrato: coProfile.tipo_contrato,
        meses_antiguedad: coProfile.meses_antiguedad_trabajo,
      },
      datos_patrimonio: {
        propietario_vivienda: coProfile.propietario_vivienda,
      },
      metadata: {
        proveedor: 'DataCrédito Colombia',
        fecha_consulta: new Date().toISOString(),
        version_servicio: '3.1',
      },
    };
  }

  console.log(`\n[${request.country} Provider] Sending callback for request ${correlationId}`);
  console.log(`[${request.country} Provider] Document: ${request.documentId}`);
  console.log(`[${request.country} Provider] Callback URL: ${request.callbackUrl}`);

  try {
    const response = await fetch(request.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provider-Country': request.country,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[${request.country} Provider] ✓ Callback successful (status ${response.status})`);
      pendingRequests.delete(correlationId);
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

app.get('/test-users', (_req: Request, res: Response) => {
  res.json({
    mexico: Object.entries(TEST_USERS.MX).map(([documentId, profile]) => ({
      document_id: documentId,
      nombre: profile.nombre_completo,
      score: profile.calificacion_buro,
      expected_result: profile.calificacion_buro >= 600 ? 'APPROVED' : 'REJECTED',
    })),
    colombia: Object.entries(TEST_USERS.CO).map(([documentId, profile]) => ({
      document_id: documentId,
      nombre: profile.nombre,
      score: profile.score_datacredito,
      expected_result: profile.score_datacredito >= 550 ? 'APPROVED' : 'REJECTED',
    })),
  });
});

const PORT = process.env.PROVIDER_PORT || 5000;

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
    console.log(`      ${id} - ${profile.nombre_completo} (Score: ${profile.calificacion_buro})`);
  });
  console.log(`   CO (Colombia):`);
  Object.entries(TEST_USERS.CO).forEach(([id, profile]) => {
    console.log(`      ${id} - ${profile.nombre} (Score: ${profile.score_datacredito})`);
  });
  console.log('');
});
