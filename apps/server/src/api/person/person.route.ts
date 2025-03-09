import { Hono } from "hono";
import { getAllPersons, getPersonById, createPerson, updatePerson, deletePerson, PersonInput } from "./person.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { getPersonGroups } from "../group/group.service";

const persons = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const personInputSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().optional().or(z.literal('')).default(''),
  center: z.enum(["Nepal", "USA", "Australia", "UK"]).default("Nepal"),
  emailId: z.string().email().nullable().optional().default(null),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional().default(null),
  phoneNumber: z.string().nullable().optional().default(null),
  photo: z.string().nullable().optional().default(null),
  refugee: z.boolean().default(false),
  yearOfBirth: z.number().int().min(1900).nullable().optional().default(null),
});

const personUpdateSchema = personInputSchema.partial();

const paramsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

persons.onError((err, c) => {
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

export const personsRoutes = persons
  .use(authenticated)
  .get("/", async (c) => {
    const persons = await getAllPersons();
    return c.json(persons);
  })
  .get("/:id", zValidator("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const person = await getPersonById(id);
    return c.json(person);
  })
  .get("/:id/groups", async (c) => {
    const id = c.req.param("id");
    const groups = await getPersonGroups(id);
    return c.json(groups);
  })
  .post("/", zValidator("json", personInputSchema), async (c) => {
    const personData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newPerson = await createPerson(personData, user.id);
    return c.json(newPerson, 201);
  })
  .put("/:id", zValidator("param", paramsSchema), zValidator("json", personUpdateSchema), async (c) => {
    const { id } = c.req.valid("param");
    const updateData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const updatedPerson = await updatePerson(id, updateData, user.id);
    return c.json(updatedPerson);
  })
  .delete("/:id", zValidator("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    await deletePerson(id);
    return c.json({ success: true });
  })
  .get("/:id/groups", async (c) => {
    const id = c.req.param("id");
    const groups = await getPersonGroups(id);
    return c.json(groups);
  });

export type PersonType = typeof personsRoutes;