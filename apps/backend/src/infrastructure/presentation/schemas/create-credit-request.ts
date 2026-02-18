import z from "zod";

export const createCreditRequestSchema = z.object({
  country: z.string()
    .length(2, "El código de país debe tener 2 caracteres (ej: MX, CO)")
    .toUpperCase()
    .trim(),
  fullName: z.string()
    .min(1, "El nombre completo es requerido")
    .max(255, "El nombre completo no debe exceder 255 caracteres")
    .trim(),
  documentId: z.string()
    .min(1, "El documento de identidad es requerido")
    .max(64, "El documento de identidad no debe exceder 64 caracteres")
    .trim(),
  requestedAmount: z.number()
    .positive("El monto solicitado debe ser positivo")
    .finite("El monto solicitado debe ser un número válido"),
  monthlyIncome: z.number()
    .positive("El ingreso mensual debe ser positivo")
    .finite("El ingreso mensual debe ser un número válido"),
  userId: z.string()
    .uuid("El ID de usuario debe ser un UUID válido")
    .optional(),
});

export type CreateCreditRequestInput = z.infer<typeof createCreditRequestSchema>;
