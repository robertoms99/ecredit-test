import z from "zod";

export const updateCreditRequestStatusParamsSchema = z.object({
  id: z.string().uuid({
    message: "El ID de solicitud de crédito debe ser un UUID válido"
  }),
});

export const updateCreditRequestStatusBodySchema = z.object({
  status: z.string().min(1, "El código de estado es requerido").trim(),
  reason: z.string().max(1000, "La razón no debe exceder 1000 caracteres").trim().optional(),
});

export type UpdateCreditRequestStatusParams = z.infer<typeof updateCreditRequestStatusParamsSchema>;
export type UpdateCreditRequestStatusBody = z.infer<typeof updateCreditRequestStatusBodySchema>;
