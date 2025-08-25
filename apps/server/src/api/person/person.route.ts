import { Hono } from "hono";
import { 
  getAllPersons, 
  getPersonById, 
  createPerson, 
  updatePerson, 
  deletePerson,
  getPersonsByType,
  getAllKramaInstructors,
  getPersonWithKramaInstructor
} from "./person.service";
import { authenticated } from "../../middlewares/session";
import { requirePermission, adminOnly } from "../../middlewares/authorization";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { getPersonGroups } from "../group/group.service";
import { PersonType } from "./person.types";

const persons = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const personInputSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable().optional().default(null),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().optional().or(z.literal('')).default(''),
  center: z.enum(["Nepal", "USA", "Australia", "UK"]).default("Nepal"),
  emailId: z.string().email().nullable().optional().default(null),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional().default(null),
  phoneNumber: z.string().nullable().optional().default(null),
  primaryPhone: z.string().nullable().optional().default(null),
  secondaryPhone: z.string().nullable().optional().default(null),
  photo: z.string().nullable().optional().default(null),
  yearOfBirth: z.number().int().min(1900).nullable().optional().default(null),
  type: z.enum(["interested", "contact", "sangha_member", "attended_orientation"]).default("interested"),
  country: z.string().nullable().optional().default(null),
  nationality: z.string().nullable().optional().default(null),
  languagePreference: z.string().nullable().optional().default(null),
  occupation: z.string().nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
  refugeName: z.string().nullable().optional().default(null),
  yearOfRefuge: z.number().int().min(1900).nullable().optional().default(null),
  title: z.enum(["dharma_dhar", "sahayak_dharmacharya", "sahayak_samathacharya"]).nullable().optional().default(null),
  membershipType: z.enum(["Life Time", "Board Member", "General Member", "Honorary Member"]).nullable().optional().default(null),
  hasMembershipCard: z.boolean().nullable().optional().default(null),
  membershipCardNumber: z.string().nullable().optional().default(null),
  yearOfRefugeCalendarType: z.enum(["BS", "AD"]).nullable().optional().default(null),
  is_krama_instructor: z.boolean().nullable().optional().default(false),
  krama_instructor_person_id: z.string().uuid().nullable().optional().default(null),
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
  .get("/", requirePermission("canViewPersons"), async (c) => {
    const type = c.req.query('type') as PersonType | undefined;
    
    if (type && ['interested', 'contact', 'sangha_member', 'attended_orientation'].includes(type)) {
      const persons = await getPersonsByType(type);
      return c.json(persons);
    }
    
    const persons = await getAllPersons();
    return c.json(persons);
  })
  // Krama Instructor routes - MUST be before /:id routes
  .get("/krama-instructors", requirePermission("canViewPersons"), async (c) => {
    const kramaInstructors = await getAllKramaInstructors();
    return c.json(kramaInstructors);
  })
  .get("/:id", zValidator("param", paramsSchema), requirePermission("canViewPersons"), async (c) => {
    const { id } = c.req.valid("param");
    const person = await getPersonById(id);
    return c.json(person);
  })
  .get("/:id/groups", requirePermission("canViewGroups"), async (c) => {
    const id = c.req.param("id");
    const groups = await getPersonGroups(id);
    return c.json(groups);
  })
  .get("/:id/with-krama-instructor", zValidator("param", paramsSchema), requirePermission("canViewPersons"), async (c) => {
    const { id } = c.req.valid("param");
    const personWithKrama = await getPersonWithKramaInstructor(id);
    return c.json(personWithKrama);
  })
  .post("/", zValidator("json", personInputSchema), requirePermission("canCreatePersons"), async (c) => {
    const personData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newPerson = await createPerson(personData, user.id);
    return c.json(newPerson, 201);
  })
  .put("/:id", zValidator("param", paramsSchema), zValidator("json", personUpdateSchema), requirePermission("canEditPersons"), async (c) => {
    const { id } = c.req.valid("param");
    const updateData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const updatedPerson = await updatePerson(id, updateData, user.id);
    return c.json(updatedPerson);
  })
  .delete("/:id", zValidator("param", paramsSchema), requirePermission("canDeletePersons"), async (c) => {
    const { id } = c.req.valid("param");
    await deletePerson(id);
    return c.json({ success: true });
  });

export type PersonType = typeof personsRoutes;