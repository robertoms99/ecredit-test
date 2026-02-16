import z from "zod";

export const getCreditRequestParamsSchema = z.object({
  id: z.string().uuid({
    message: "Credit request ID must be a valid UUID"
  }),
});

export type GetCreditRequestParams = z.infer<typeof getCreditRequestParamsSchema>;
