import z from "zod";

export const processBankDataSchema = z.object({
  externalRequestId: z.string().uuid(),
  payload: z.record(z.string(), z.any())
});
