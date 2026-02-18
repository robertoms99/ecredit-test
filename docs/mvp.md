# MVP - Visión del Producto

## Contexto y Problema

Este MVP está orientado a personas que desean iniciar su propia fintech pero se enfrentan a miedos y cautelas naturales al momento de otorgar préstamos y atender solicitudes de crédito. Muchas veces, estos emprendedores deciden trabajar únicamente con clientes de confianza, como es el caso de los conocidos "pagadiarios" o "gota a gota" en Latinoamérica.

El sistema eCredit abre la posibilidad de gestionar clientes de múltiples partes del mundo, manteniendo el enfoque en relaciones de confianza. Por esta razón, el MVP tiene un enfoque centrado en el rol de administrador, quien puede:

- Revisar los estados de las solicitudes de crédito
- Entender cómo y por qué las solicitudes transicionan entre estados
- Tener visibilidad completa del flujo de evaluación

## Alcance Actual

El sistema actualmente soporta dos países:
- **México (MX)**: Validación de CURP, evaluación con puntaje de buró de crédito
- **Colombia (CO)**: Validación de cédula de ciudadanía, evaluación con criterios locales

### Funcionalidades Incluidas

1. **Gestión de solicitudes de crédito**
   - Creación de solicitudes con validación de documentos por país
   - Listado con filtros por país, estado, fechas y documento de identidad
   - Búsqueda por ID de solicitud

2. **Flujo automatizado de evaluación**
   - Solicitud automática de datos bancarios al proveedor correspondiente
   - Recepción de datos vía webhook
   - Evaluación de riesgo basada en reglas por país
   - Transiciones automáticas de estado con trazabilidad completa

3. **Actualizaciones en tiempo real**
   - Notificaciones vía Socket.IO cuando cambian los estados
   - Interfaz reactiva que refleja cambios sin recargar

4. **Historial de transiciones**
   - Registro detallado de cada cambio de estado
   - Información sobre quién o qué disparó la transición
   - Metadatos de evaluación cuando aplica

## Extensibilidad hacia Multi-roles

Aunque el MVP actual tiene un enfoque de administrador, la arquitectura fue diseñada pensando en extensibilidad. Gracias a:

- Las estrategias por país que encapsulan validaciones y evaluaciones
- El sistema flexible de estados y transiciones
- La separación clara entre dominio e infraestructura

Es posible extender el sistema para soportar múltiples roles de usuario, donde:

- **Clientes** podrían gestionar sus propias solicitudes de crédito
- **Administradores** mantendrían la supervisión y configuración
- **Analistas** podrían revisar casos específicos

El administrador podría tener plena confianza en las validaciones y evaluaciones de riesgo estructuradas en el MVP actual, las cuales están diseñadas siguiendo regulaciones y patrones de validación específicos de cada país.

## Simulador de Proveedores Bancarios

Con el fin de demostrar el flujo completo de integración, el sistema incluye un simulador de proveedores bancarios. Este componente simula:

- La recepción de solicitudes de datos bancarios
- El procesamiento asíncrono de información
- La devolución de datos vía webhook usando un `correlation_id`

El flujo implementado se basa en investigación de cómo funcionan estas integraciones en sistemas reales. Aunque los sistemas de producción pueden variar significativamente en complejidad, la arquitectura presente puede adaptarse a cualquier variación gracias a su diseño basado en interfaces y estrategias.

### Supuestos del Simulador

- Todos los proveedores bancarios generan un `correlation_id` o identificador de correlación
- Este identificador se usa para vincular la respuesta del webhook con la solicitud original
- Esta medida añade seguridad al evitar recibir llamadas no relacionadas con solicitudes legítimas

## Limitaciones Conocidas

- **Rol único**: Solo existe el rol de administrador
- **Sin persistencia de sesiones**: El sistema no mantiene sesiones distribuidas
- **Proveedores simulados**: Los datos bancarios son generados, no provienen de fuentes reales
- **Sin sistema de loggers externos**: El sistema confía en trazas exactas de los eventos causados en la aplicación, enlazados al `credit_request_id` y manejados en la tabla `status_transitions`
