import z from "zod";

export const updateCreditRequestStatusParamsSchema = z.object({
  id: z.string().uuid({
    message: "Credit request ID must be a valid UUID"
  }),
});

export const updateCreditRequestStatusBodySchema = z.object({
  status: z.string().min(1, "Status code is required").trim(),
});

export type UpdateCreditRequestStatusParams = z.infer<typeof updateCreditRequestStatusParamsSchema>;
export type UpdateCreditRequestStatusBody = z.infer<typeof updateCreditRequestStatusBodySchema>;
