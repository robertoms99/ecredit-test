import z from "zod";

export const listCreditRequestsQuerySchema = z.object({
  country: z.string().length(2).optional(),
  status: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  {
    message: "La fecha 'desde' debe ser anterior o igual a la fecha 'hasta'",
    path: ["from"],
  }
).refine(
  (data) => {
    if (data.to) {
      const toDate = new Date(data.to);
      const now = new Date();
      toDate.setHours(23, 59, 59, 999);
      now.setHours(23, 59, 59, 999);
      return toDate <= now;
    }
    return true;
  },
  {
    message: "La fecha 'hasta' no puede ser mayor al día actual",
    path: ["to"],
  }
);

export type ListCreditRequestsQuery = z.infer<typeof listCreditRequestsQuerySchema>;
