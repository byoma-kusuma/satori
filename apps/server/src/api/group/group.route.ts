import { Hono } from "hono";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addPersonToGroup,
  removePersonFromGroup,
  getGroupMembers,
  GroupInput
} from "./group.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";

const groups = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const groupsRoutes = groups
  .use(authenticated)
  .get("/", async (c) => {
    const groups = await getAllGroups();
    return c.json(groups);
  })
  .get("/:id", async (c) => {
    const group = await getGroupById(c.req.param("id"));
    return c.json(group);
  })
  .post("/", async (c) => {
    const groupData = await c.req.json<GroupInput>();
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newGroup = await createGroup(groupData, user.id);
    return c.json(newGroup, 201);
  })
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const updateData = await c.req.json<Partial<GroupInput>>();
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const updatedGroup = await updateGroup(id, updateData, user.id);
    return c.json(updatedGroup);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await deleteGroup(id);
    return c.json({ message: "Group deleted" });
  })
  .get("/:id/persons", async (c) => {
    const id = c.req.param("id");
    const members = await getGroupMembers(id);
    return c.json(members);
  })
  .post("/:id/persons", async (c) => {
    const groupId = c.req.param("id");
    const { personId } = await c.req.json<{ personId: string }>();
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const result = await addPersonToGroup(personId, groupId, user.id);
    return c.json(result, 201);
  })
  .delete("/:groupId/persons/:personId", async (c) => {
    const groupId = c.req.param("groupId");
    const personId = c.req.param("personId");
    await removePersonFromGroup(personId, groupId);
    return c.json({ message: "Person removed from group" });
  });

export type GroupType = typeof groupsRoutes;