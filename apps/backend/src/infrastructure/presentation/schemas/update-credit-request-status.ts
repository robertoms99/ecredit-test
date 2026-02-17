import z from "zod";

export const updateCreditRequestStatusParamsSchema = z.object({
  id: z.string().uuid({
    message: "Credit request ID must be a valid UUID"
  }),
});

export const updateCreditRequestStatusBodySchema = z.object({
  status: z.string().min(1, "Status code is required").trim(),
  reason: z.string().max(1000, "Reason must be less than 1000 characters").trim().optional(),
});

export type UpdateCreditRequestStatusParams = z.infer<typeof updateCreditRequestStatusParamsSchema>;
export type UpdateCreditRequestStatusBody = z.infer<typeof updateCreditRequestStatusBodySchema>;
