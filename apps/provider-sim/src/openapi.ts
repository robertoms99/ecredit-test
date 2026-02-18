export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Provider Simulator API',
    description: 'Simulador de proveedores bancarios externos para eCredit',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Desarrollo' },
  ],
  tags: [
    { name: 'Providers', description: 'Endpoints de proveedores por país' },
    { name: 'Utils', description: 'Utilidades' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Utils'],
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
                    service: { type: 'string', example: 'Provider Simulator' },
                    uptime: { type: 'number' },
                    pending_requests: { type: 'integer' },
                    test_users: {
                      type: 'object',
                      properties: {
                        MX: { type: 'array', items: { type: 'string' } },
                        CO: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/test-users': {
      get: {
        tags: ['Utils'],
        summary: 'Listar usuarios de prueba',
        responses: {
          '200': {
            description: 'Usuarios disponibles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mexico: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TestUser' },
                    },
                    colombia: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TestUser' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/providers/mx': {
      post: {
        tags: ['Providers'],
        summary: 'Solicitar datos bancarios - México',
        description: 'Inicia una consulta asíncrona al proveedor de México (Buró de Crédito). Después de 2-8 segundos enviará los datos al callback_url.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProviderRequest' },
              example: {
                document_id: 'GOMC860101HDFRRA09',
                credit_request_id: '123e4567-e89b-12d3-a456-426614174000',
                callback_url: 'http://localhost:3000/api/webhook/process-bank-data',
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Solicitud aceptada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProviderAcceptedResponse' },
              },
            },
          },
          '400': {
            description: 'Campos requeridos faltantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserNotFoundError' },
              },
            },
          },
        },
      },
    },
    '/providers/co': {
      post: {
        tags: ['Providers'],
        summary: 'Solicitar datos bancarios - Colombia',
        description: 'Inicia una consulta asíncrona al proveedor de Colombia (DataCrédito). Después de 2-8 segundos enviará los datos al callback_url.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProviderRequest' },
              example: {
                document_id: '1234567890',
                credit_request_id: '123e4567-e89b-12d3-a456-426614174000',
                callback_url: 'http://localhost:3000/api/webhook/process-bank-data',
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Solicitud aceptada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProviderAcceptedResponse' },
              },
            },
          },
          '400': {
            description: 'Campos requeridos faltantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserNotFoundError' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ProviderRequest: {
        type: 'object',
        required: ['document_id', 'credit_request_id', 'callback_url'],
        properties: {
          document_id: {
            type: 'string',
            description: 'CURP (México) o Cédula de Ciudadanía (Colombia)',
          },
          credit_request_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID de la solicitud de crédito en el sistema principal',
          },
          callback_url: {
            type: 'string',
            format: 'uri',
            description: 'URL donde se enviarán los datos bancarios',
          },
        },
      },
      ProviderAcceptedResponse: {
        type: 'object',
        properties: {
          correlation_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único de la solicitud al proveedor',
          },
          status: {
            type: 'string',
            enum: ['PENDING'],
          },
          message: { type: 'string' },
          estimated_time_seconds: {
            type: 'integer',
            description: 'Tiempo estimado de respuesta',
          },
        },
      },
      UserNotFoundError: {
        type: 'object',
        properties: {
          error_code: {
            type: 'string',
            enum: ['USER_NOT_FOUND'],
          },
          error: { type: 'string' },
          details: {
            type: 'object',
            properties: {
              document_id: { type: 'string' },
              country: { type: 'string' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      TestUser: {
        type: 'object',
        properties: {
          document_id: { type: 'string' },
          nombre: { type: 'string' },
          score: { type: 'integer' },
          expected_result: {
            type: 'string',
            enum: ['APPROVED', 'REJECTED'],
          },
        },
      },
    },
  },
};
