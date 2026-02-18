export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'eCredit API',
    description: 'API para gestión de solicitudes de crédito',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Desarrollo' },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticación' },
    { name: 'Credit Requests', description: 'Solicitudes de crédito' },
    { name: 'Webhooks', description: 'Webhooks de proveedores' },
    { name: 'Status', description: 'Estados de solicitud' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Servicio operativo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin1@ecredit.com' },
                  password: { type: 'string', example: 'admin123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { description: 'Email y contraseña son requeridos' },
          '401': { description: 'Credenciales inválidas' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener usuario actual',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Usuario actual',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { description: 'No autorizado' },
          '404': { description: 'Usuario no encontrado' },
        },
      },
    },
    '/api/credit-requests': {
      get: {
        tags: ['Credit Requests'],
        summary: 'Listar solicitudes de crédito',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string', minLength: 2, maxLength: 2 }, description: 'Código de país (MX, CO)' },
          { name: 'status', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'ID del estado' },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Fecha desde' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Fecha hasta' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
        ],
        responses: {
          '200': {
            description: 'Lista de solicitudes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CreditRequest' },
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'No autorizado' },
        },
      },
      post: {
        tags: ['Credit Requests'],
        summary: 'Crear solicitud de crédito',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCreditRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Solicitud creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreditRequest' },
              },
            },
          },
          '400': { description: 'Datos inválidos' },
          '401': { description: 'No autorizado' },
        },
      },
    },
    '/api/credit-requests/{id}': {
      get: {
        tags: ['Credit Requests'],
        summary: 'Obtener detalle de solicitud',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Detalle de la solicitud',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreditRequest' },
              },
            },
          },
          '403': { description: 'Solo puedes ver solicitudes que creaste' },
          '404': { description: 'Solicitud no encontrada' },
          '401': { description: 'No autorizado' },
        },
      },
    },
    '/api/credit-requests/{id}/status': {
      patch: {
        tags: ['Credit Requests'],
        summary: 'Actualizar estado de solicitud',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', description: 'Código del estado (APPROVED, REJECTED)' },
                  reason: { type: 'string', maxLength: 1000, description: 'Razón del cambio (opcional)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Estado actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreditRequest' },
              },
            },
          },
          '400': { description: 'Transición no permitida' },
          '401': { description: 'No autorizado' },
          '403': { description: 'Solo puedes actualizar solicitudes que creaste' },
          '404': { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/api/credit-requests/{id}/history': {
      get: {
        tags: ['Credit Requests'],
        summary: 'Obtener historial de estados',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Historial de transiciones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/StatusTransition' },
                },
              },
            },
          },
          '401': { description: 'No autorizado' },
          '403': { description: 'Solo puedes ver historial de solicitudes que creaste' },
          '404': { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/api/webhook/process-bank-data': {
      post: {
        tags: ['Webhooks'],
        summary: 'Recibir datos bancarios del proveedor',
        description: 'Endpoint llamado por los proveedores bancarios para enviar datos financieros',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['correlation_id'],
                properties: {
                  correlation_id: { type: 'string', format: 'uuid', description: 'ID de correlación del proveedor' },
                },
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Datos procesados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Falta correlation_id o es inválido' },
          '404': { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/api/request-statuses': {
      get: {
        tags: ['Status'],
        summary: 'Listar estados disponibles',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de estados',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RequestStatus' },
                },
              },
            },
          },
          '401': { description: 'No autorizado' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
        },
      },
      CreateCreditRequest: {
        type: 'object',
        required: ['country', 'fullName', 'documentId', 'requestedAmount', 'monthlyIncome'],
        properties: {
          country: { type: 'string', minLength: 2, maxLength: 2, example: 'MX', description: 'Código ISO del país' },
          fullName: { type: 'string', maxLength: 255, example: 'Juan Pérez' },
          documentId: { type: 'string', maxLength: 64, example: 'GOMC860101HDFRRA09', description: 'CURP (MX) o Cédula (CO)' },
          requestedAmount: { type: 'number', minimum: 0, example: 50000 },
          monthlyIncome: { type: 'number', minimum: 0, example: 25000 },
        },
      },
      CreditRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          country: { type: 'string', minLength: 2, maxLength: 2 },
          fullName: { type: 'string' },
          documentId: { type: 'string' },
          requestedAmount: { type: 'number' },
          monthlyIncome: { type: 'number' },
          requestedAt: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' },
          statusId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BankingInfo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          externalRequestId: { type: 'string', format: 'uuid', nullable: true },
          providerName: { type: 'string' },
          providerResponseAt: { type: 'string', format: 'date-time', nullable: true },
          financialData: { type: 'object', additionalProperties: true },
          fetchStatus: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
          errorMessage: { type: 'string', nullable: true },
          retryCount: { type: 'integer' },
          creditRequestId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RequestStatus: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', enum: ['CREATED', 'PENDING_FOR_BANK_DATA', 'EVALUATING', 'APPROVED', 'REJECTED', 'FAILED_FROM_PROVIDER'] },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isFinal: { type: 'boolean' },
          displayOrder: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      StatusTransition: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          creditRequestId: { type: 'string', format: 'uuid' },
          fromStatusId: { type: 'string', format: 'uuid', nullable: true },
          toStatusId: { type: 'string', format: 'uuid' },
          reason: { type: 'string', nullable: true },
          triggeredBy: { type: 'string', enum: ['user', 'system', 'webhook', 'provider'] },
          metadata: { type: 'object', additionalProperties: true },
          fromStatus: { $ref: '#/components/schemas/RequestStatus' },
          toStatus: { $ref: '#/components/schemas/RequestStatus' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
