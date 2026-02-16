import z from "zod";

export const processBankDataSchema = z.object({
  request_id: z.string().uuid(),
  payload: z.record(z.string(), z.any())
});
