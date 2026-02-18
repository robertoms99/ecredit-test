import z from "zod";

export const getCreditRequestParamsSchema = z.object({
  id: z.string().uuid({
    message: "El ID de solicitud de crédito debe ser un UUID válido"
  }),
});

export type GetCreditRequestParams = z.infer<typeof getCreditRequestParamsSchema>;
