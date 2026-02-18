# Arquitectura del Sistema

## Visión General

El backend de eCredit está diseñado siguiendo los principios de **arquitectura hexagonal** (también conocida como ports and adapters), con múltiples capas que aíslan completamente el dominio y las reglas de negocio de la infraestructura.

El objetivo principal es lograr máxima **escalabilidad** y **mantenibilidad** a largo plazo, haciendo que el dominio sea completamente independiente de detalles de implementación como bases de datos, frameworks web o servicios externos.

## Principios de Diseño

### Arquitectura Hexagonal

La aplicación se divide en tres capas principales:

```
┌─────────────────────────────────────────────────┐
│                  Presentación                    │
│         (Controllers, Middlewares, Schemas)      │
├─────────────────────────────────────────────────┤
│                   Dominio                        │
│    (Entidades, Casos de Uso, Estrategias,       │
│     Puertos/Interfaces, Errores)                │
├─────────────────────────────────────────────────┤
│                 Infraestructura                  │
│   (Repositorios, Adaptadores, Jobs, Cache,      │
│    Clientes HTTP, Base de Datos)                │
└─────────────────────────────────────────────────┘
```

### Patrones Utilizados

- **Inyección de Dependencias**: Las dependencias se inyectan en tiempo de construcción, facilitando testing y flexibilidad
- **Strategy Pattern**: Para manejar lógica específica por país y transiciones de estado
- **Decorator Pattern**: Para añadir funcionalidades como caching sin modificar la lógica existente
- **Builder Pattern**: Para construcción compleja de objetos
- **Repository Pattern**: Para abstraer el acceso a datos

### Principios SOLID

- **Single Responsibility**: Cada clase tiene una única razón para cambiar
- **Open/Closed**: El sistema está abierto a extensión pero cerrado a modificación
- **Liskov Substitution**: Las implementaciones son intercambiables a través de interfaces
- **Interface Segregation**: Interfaces pequeñas y específicas
- **Dependency Inversion**: El dominio depende de abstracciones, no de implementaciones

## Estructura del Backend

```
apps/backend/src/
├── domain/                    # Capa de dominio (núcleo del negocio)
│   ├── entities/              # Entidades de dominio
│   ├── errors/                # Errores de dominio tipados
│   ├── ports/                 # Interfaces (contratos)
│   │   ├── repositories/      # Interfaces de repositorios
│   │   └── jobs/              # Interfaces de trabajos asíncronos
│   ├── strategies/            # Estrategias de negocio
│   │   ├── country/           # Estrategias por país
│   │   └── transitions/       # Estrategias de transición de estado
│   └── use-cases/             # Casos de uso (lógica de aplicación)
│
└── infrastructure/            # Capa de infraestructura
    ├── adapters/              # Implementaciones de puertos
    │   ├── repositories/      # Repositorios concretos (Drizzle)
    │   ├── cache/             # Decoradores de caché
    │   └── http/              # Clientes HTTP
    ├── db/                    # Configuración de base de datos
    │   ├── migrations/        # Migraciones de esquema
    │   └── schema/            # Definición de tablas
    ├── jobs/                  # Implementación de trabajos
    ├── presentation/          # Capa de presentación
    │   ├── controllers/       # Controladores HTTP
    │   ├── middleware/        # Middlewares (auth, errors)
    │   └── schemas/           # Validación de entrada (Zod)
    └── di.ts                  # Contenedor de inyección de dependencias
```

## Estrategias por País

El sistema utiliza el patrón Strategy para encapsular la lógica específica de cada país. Esto permite añadir nuevos países sin modificar el código existente.

### Estructura de una Estrategia de País

```
strategies/country/
├── types.ts                        # Tipos compartidos (CountryConfig, etc.)
├── country-strategy.interface.ts   # Interfaz que deben implementar las estrategias
├── country-strategy.registry.ts    # Registro de estrategias disponibles
├── bank-data-provider.interface.ts # Interfaz para proveedores de datos bancarios
├── credit-evaluator.interface.ts   # Interfaz para evaluadores de crédito
├── document-validator.interface.ts # Interfaz para validadores de documentos
├── external-data-validator.interface.ts # Interfaz para validar datos externos
└── countries/
    ├── mexico/
    │   ├── config.ts               # Configuración del país (límites, moneda, etc.)
    │   ├── mexico-strategy.ts      # Estrategia principal que compone los componentes
    │   ├── document-validator.ts   # Validación de CURP
    │   ├── credit-evaluator.ts     # Evaluación de riesgo con reglas mexicanas
    │   ├── bank-data-provider.ts   # Cliente del proveedor bancario
    │   ├── external-data-validator.ts # Validación de datos del proveedor
    │   └── provider-errors.ts      # Catálogo de errores del proveedor
    └── colombia/
        └── ... (misma estructura)
```

### Añadir un Nuevo País

Para añadir un nuevo país (por ejemplo, Perú):

1. Crear la carpeta `strategies/country/countries/peru/`
2. Implementar los archivos requeridos siguiendo las interfaces
3. Registrar la estrategia en el `CountryStrategyRegistry`

No se requiere modificar ningún otro código del sistema.

## Estrategias de Transición de Estado

Las transiciones de estado también siguen el patrón Strategy, permitiendo definir comportamientos específicos para cada estado.

### Estructura

```
strategies/transitions/
├── status-transition.interface.ts  # Interfaz para estrategias de transición
├── status-transition.registry.ts   # Registro de estrategias
├── created-transition.ts           # Lógica al entrar en estado CREATED
└── evaluating-transition.ts        # Lógica al entrar en estado EVALUATING
```

### Flujo de Transiciones

1. **CREATED**: Solicita datos bancarios al proveedor y transiciona a `PENDING_FOR_BANK_DATA`
2. **PENDING_FOR_BANK_DATA**: Espera la respuesta del webhook del proveedor
3. **FAILED_FROM_PROVIDER** Este estado puede ser producido cuando el proveedor lanza un error concreto
3. **EVALUATING**: Evalúa la solicitud con los datos recibidos y transiciona a `APPROVED` o `REJECTED`

Cada transición puede:
- Ejecutar lógica de negocio
- Interactuar con servicios externos
- Registrar metadatos de la transición
- Disparar eventos

## Sistema de Caché

El sistema implementa la estrategia **Cache-Aside** usando Redis para evitar sobrecargas a la base de datos.

### Implementación con Decorator Pattern

```typescript
// El decorador envuelve el repositorio sin que el dominio lo sepa
const cachedRepository = new CachedCreditRequestRepository(
  baseRepository,
  redisClient,
  { ttl: 300 } // 5 minutos
);
```

El flujo es:
1. Verificar si existe la clave en caché
2. Si existe, retornar el valor cacheado
3. Si no existe, consultar al repositorio original
4. Almacenar el resultado en caché
5. Retornar el resultado

Gracias al patrón Decorator, el dominio no tiene conocimiento de que existe un sistema de caché. Incluso el decorador ignora de dónde provienen los datos cuando debe consultarlos.

## Sistema de Jobs Asíncronos

Para tareas asíncronas se utiliza **pg-boss**, una librería que implementa un sistema de colas ligero sobre PostgreSQL.

### Ventajas de pg-boss

- No requiere infraestructura adicional (usa PostgreSQL existente)
- Soporte para reintentos automáticos
- Configuración de timeouts
- Librería estable del ecosistema Node.js/Bun

### JobDispatcher

Se creó una abstracción `IJobDispatcher` que permite emitir y procesar jobs de forma tipada:

```typescript
// Registrar un job
jobDispatcher.register(processCreatedRequestJob);

// Emitir un job
await jobDispatcher.emit('process-created-request', {
  creditRequestId: request.id
});
```

El dispatcher se encarga de:
- Crear las colas necesarias
- Registrar los workers
- Manejar errores y reintentos

## Comunicación en Tiempo Real

Se utiliza **Socket.IO** para comunicación bidireccional entre servidor y cliente.

### Casos de Uso

- Notificar cambios de estado de solicitudes
- Actualizar la interfaz sin necesidad de polling
- Proporcionar feedback inmediato al usuario

### Implementación

Los eventos se disparan mediante triggers de PostgreSQL que detectan cambios en las tablas relevantes y los publican a través del sistema de notificaciones de Postgres, que luego son capturados y retransmitidos vía Socket.IO.

## Base de Datos

La base de datos fue diseñada de forma extensible, contemplando futuras necesidades.

### Consideraciones

- Esquema normalizado para mantener integridad
- Índices en campos frecuentemente consultados
- Soporte para soft deletes donde aplique
- Timestamps automáticos de auditoría

### Posibles Extensiones

- Soporte para múltiples roles de usuario
- Vinculación de documentos a usuarios y países
- Historial de modificaciones de entidades
