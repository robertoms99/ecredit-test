import z from "zod";

export const processBankDataSchema = z.object({
  correlation_id: z.string().uuid(),
});
