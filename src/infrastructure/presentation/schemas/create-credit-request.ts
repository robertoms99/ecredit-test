import z from "zod";

export const createCreditRequestSchema = z.object({
  requestedAmount: z.number().min(1),
  country: z.string().nonempty(),
  fullName: z.string().nonempty(),
  documentId: z.string().nonempty(),
  monthlyIncome: z.number().min(1),
});
