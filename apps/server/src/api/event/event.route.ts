import { Hono } from "hono";
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getEventsByType,
  addParticipantToEvent,
  removeParticipantFromEvent,
  updateParticipantData,
  getEventParticipants
} from "./event.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { EventType } from "./event.types";

const events = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Create base schemas
const eventTypeSchema = z.enum(["REFUGE", "BODHIPUSPANJALI"]);

// Define the input schema for creating events
const eventInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  type: eventTypeSchema,
  metadata: z.any().optional(),
});

const eventUpdateSchema = eventInputSchema.partial();

const paramsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

const addParticipantSchema = z.object({
  personId: z.string().uuid("Invalid person ID"),
  additionalData: z.record(z.any()).optional().default({}),
});

const updateParticipantSchema = z.object({
  personId: z.string().uuid("Invalid person ID"),
  data: z.record(z.any()),
});

events.onError((err, c) => {
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

export const eventsRoutes = events
  .use(authenticated)
  // Get all events, optionally filtered by type
  .get("/", async (c) => {
    const type = c.req.query('type') as EventType | undefined;
    
    if (type && ['REFUGE', 'BODHIPUSPANJALI'].includes(type)) {
      const events = await getEventsByType(type);
      return c.json(events);
    }
    
    const events = await getAllEvents();
    return c.json(events);
  })
  // Get a specific event by ID
  .get("/:id", zValidator("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const event = await getEventById(id);
    return c.json(event);
  })
  // Create a new event
  .post("/", zValidator("json", eventInputSchema), async (c) => {
    const eventData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const newEvent = await createEvent(eventData, user.id);
    return c.json(newEvent, 201);
  })
  // Update an existing event
  .put("/:id", zValidator("param", paramsSchema), zValidator("json", eventUpdateSchema), async (c) => {
    const { id } = c.req.valid("param");
    const updateData = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    const updatedEvent = await updateEvent(id, updateData, user.id);
    return c.json(updatedEvent);
  })
  // Delete an event
  .delete("/:id", zValidator("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    await deleteEvent(id);
    return c.json({ success: true });
  })
  // Get all participants for an event
  .get("/:id/participants", zValidator("param", paramsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const participants = await getEventParticipants(id);
    return c.json(participants);
  })
  // Add a participant to an event
  .post("/:id/participants", zValidator("param", paramsSchema), zValidator("json", addParticipantSchema), async (c) => {
    const { id } = c.req.valid("param");
    const { personId, additionalData } = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    
    console.log("Adding participant to event:", {
      eventId: id,
      personId,
      additionalData
    });
    
    try {
      const result = await addParticipantToEvent({ 
        eventId: id, 
        personId,
        additionalData: additionalData || {}
      }, user.id);
      
      return c.json(result, 201);
    } catch (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
  })
  // Update a participant's data
  .put("/:id/participants/:personId", zValidator("param", z.object({
    id: z.string().min(1, "Event ID is required"),
    personId: z.string().min(1, "Person ID is required"),
  })), zValidator("json", z.object({
    data: z.record(z.any())
  })), async (c) => {
    const { id, personId } = c.req.valid("param");
    const { data } = await c.req.valid("json");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    
    const result = await updateParticipantData({
      eventId: id,
      personId,
      data
    }, user.id);
    
    return c.json(result);
  })
  // Remove a participant from an event
  .delete("/:id/participants/:personId", zValidator("param", z.object({
    id: z.string().min(1, "Event ID is required"),
    personId: z.string().min(1, "Person ID is required"),
  })), async (c) => {
    const { id, personId } = c.req.valid("param");
    const user = c.get("user");
    if (!user) throw new Error("User not found");
    
    await removeParticipantFromEvent(id, personId, user.id);
    return c.json({ success: true });
  });

export type EventsType = typeof eventsRoutes;