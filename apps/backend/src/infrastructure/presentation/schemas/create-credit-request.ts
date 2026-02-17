import z from "zod";

export const createCreditRequestSchema = z.object({
  country: z.string()
    .length(2, "Country code must be 2 characters (e.g., MX, CO)")
    .toUpperCase()
    .trim(),
  fullName: z.string()
    .min(1, "Full name is required")
    .max(255, "Full name must not exceed 255 characters")
    .trim(),
  documentId: z.string()
    .min(1, "Document ID is required")
    .max(64, "Document ID must not exceed 64 characters")
    .trim(),
  requestedAmount: z.number()
    .positive("Requested amount must be positive")
    .finite("Requested amount must be a finite number"),
  monthlyIncome: z.number()
    .positive("Monthly income must be positive")
    .finite("Monthly income must be a finite number"),
  userId: z.string()
    .uuid("User ID must be a valid UUID")
    .optional(),
});

export type CreateCreditRequestInput = z.infer<typeof createCreditRequestSchema>;
