import { Hono } from "hono";
import { 
  getAllGurus, 
  getGuruById, 
  createGuru, 
  updateGuru, 
  deleteGuru
} from "./guru.service";
import { authenticated } from "../../middlewares/session";
import { requirePermission } from "../../middlewares/authorization";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

const gurus = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const guruInputSchema = z.object({
  guruName: z.string().min(1, "Guru name is required"),
});

const guruUpdateSchema = guruInputSchema.partial();

const paramsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

gurus.onError((err, c) => {
  console.error(`${err}`);
  
  if (err instanceof z.ZodError) {
    return c.json({ 
      success: false, 
      message: "Validation error", 
      errors: err.errors 
    }, 400);
  }
  
  if (err instanceof HTTPException) {
    return c.json({ 
      success: false, 
      message: err.message 
    }, err.status);
  }
  
  return c.json({ 
    success: false, 
    message: "Internal server error" 
  }, 500);
});

export const gurusRoutes = gurus
  .use(authenticated)
  .get("/", requirePermission("canViewPersons"), async (c) => {
    const gurus = await getAllGurus();
    return c.json(gurus);
  })
  .get("/:id", zValidator("param", paramsSchema), requirePermission("canViewPersons"), async (c) => {
    const { id } = c.req.valid("param");
    const guru = await getGuruById(id);
    return c.json(guru);
  })
  .post("/", zValidator("json", guruInputSchema), requirePermission("canCreatePersons"), async (c) => {
    const guruData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newGuru = await createGuru(guruData, user.id);
    return c.json(newGuru, 201);
  })
  .put("/:id", zValidator("param", paramsSchema), zValidator("json", guruUpdateSchema), requirePermission("canEditPersons"), async (c) => {
    const { id } = c.req.valid("param");
    const updateData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    
    const updatedGuru = await updateGuru(id, updateData, user.id);
    return c.json(updatedGuru);
  })
  .delete("/:id", zValidator("param", paramsSchema), requirePermission("canDeletePersons"), async (c) => {
    const { id } = c.req.valid("param");
    await deleteGuru(id);
    return c.json({ success: true });
  });

export type GuruType = typeof gurusRoutes;