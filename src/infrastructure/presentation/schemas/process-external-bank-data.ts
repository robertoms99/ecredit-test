import z from "zod";

export const processBankDataSchema = z.object({
  external_request_id: z.string().uuid(),
});
