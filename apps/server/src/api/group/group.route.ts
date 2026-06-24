import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addPersonToGroup,
  removePersonFromGroup,
  getGroupMembers,
  addPersonsToGroupsBulk,
  GroupInput
} from "./group.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";
import { sendEmail } from "../../lib/email";
import { getUserById } from "../user/user.service";
import { db } from "../../database";

const groups = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const groupsRoutes = groups
  .use(authenticated)
  .get("/", async (c) => {
    const sessionUser = c.get("user");
    if (sessionUser) {
      const userData = await getUserById(sessionUser.id);
      if (userData.role === "group_admin") {
        const assignments = await db
          .selectFrom("user_group_assignment")
          .select("group_id")
          .where("user_id", "=", sessionUser.id)
          .execute();
        const groupIds = assignments.map((a) => a.group_id);
        const groups = await getAllGroups(groupIds);
        return c.json(groups);
      }
    }
    const groups = await getAllGroups();
    return c.json(groups);
  })
  .post('/bulk-add', async (c) => {
    const { personIds, groupIds } = await c.req.json<{ personIds?: string[]; groupIds?: string[] }>()
    const user = c.get('user')
    if (!user) throw new Error('User not found')

    if (!Array.isArray(personIds) || personIds.length === 0 || !Array.isArray(groupIds) || groupIds.length === 0) {
      return c.json({ error: 'personIds and groupIds are required' }, 400)
    }

    const result = await addPersonsToGroupsBulk(personIds, groupIds, user.id)
    return c.json(result)
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
  })
  .post(
    "/:id/email",
    zValidator(
      "json",
      z.object({
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(1, "Message is required"),
      })
    ),
    async (c) => {
      const groupId = c.req.param("id");
      const { subject, message } = c.req.valid("json");
      const user = c.get("user");
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const members = await getGroupMembers(groupId);
      const withEmail = members.filter((m) => m.emailId);
      const skipped = members.length - withEmail.length;

      const results = await Promise.allSettled(
        withEmail.map((m) =>
          sendEmail({
            to: m.emailId!,
            subject,
            text: message,
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return c.json({ sent, skipped, failed });
    }
  );

export type GroupType = typeof groupsRoutes;
