import { Hono } from "hono";
import { getAllPersons, getPersonById, createPerson, updatePerson, deletePerson, PersonInput } from "./person.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";

const persons = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const personsRoutes = persons
  .use(authenticated)
  .get("/", async (c) => {
    const persons = await getAllPersons();
    return c.json(persons);
  })
  .get("/:id", async (c) => {
    const person = await getPersonById(c.req.param("id"));
    return c.json(person);
  })
  .post("/", async (c) => {
    const personData = await c.req.json<PersonInput>();
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newPerson = await createPerson(personData, user.id);
    return c.json(newPerson, 201);
  })
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const updateData = await c.req.json<Partial<PersonInput>>();
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const updatedPerson = await updatePerson(id, updateData, user.id);
    return c.json(updatedPerson);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await deletePerson(id);
    return c.json({ message: "Person deleted" });
  });

export type PersonType = typeof personsRoutes;