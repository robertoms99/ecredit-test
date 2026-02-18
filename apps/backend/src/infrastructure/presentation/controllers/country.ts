import { Hono } from "hono";
import { listCountriesUseCase } from "../../di";

const router = new Hono();

router.get("/", (c) => {
  const countries = listCountriesUseCase.execute();
  return c.json(countries);
});

export default router;
