import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const sendSOSAlert = action({
  args: {
    message: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    contactsNotified: number;
    sosEventId: Id<"sosEvents">;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get active contacts
    const contacts: Array<Doc<"contacts">> = await ctx.runQuery(internal.sos.getActiveContactsInternal, { userId });
    
    if (contacts.length === 0) {
      throw new Error("No active emergency contacts found. Please add contacts first.");
    }

    // Create SOS event
    const sosEventId: Id<"sosEvents"> = await ctx.runMutation(internal.sos.createSOSEvent, {
      userId,
      message: args.message,
      latitude: args.latitude,
      longitude: args.longitude,
      locationAccuracy: args.locationAccuracy,
      contactIds: contacts.map((c: Doc<"contacts">) => c._id),
    });

    // Send SMS to all contacts
    const results = await Promise.allSettled(
      contacts.map((contact: Doc<"contacts">) => 
        ctx.runAction(internal.sms.sendSMS, {
          phone: contact.phone,
          name: contact.name,
          message: args.message,
          latitude: args.latitude,
          longitude: args.longitude,
        })
      )
    );

    // Update SOS event status
    const allSuccessful: boolean = results.every((result: any) => result.status === 'fulfilled');
    await ctx.runMutation(internal.sos.updateSOSEventStatus, {
      sosEventId,
      status: allSuccessful ? "sent" : "failed",
    });

    return {
      success: allSuccessful,
      contactsNotified: contacts.length,
      sosEventId,
    };
  },
});

export const createSOSEvent = internalMutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args): Promise<Id<"sosEvents">> => {
    return await ctx.db.insert("sosEvents", {
      userId: args.userId,
      message: args.message,
      latitude: args.latitude,
      longitude: args.longitude,
      locationAccuracy: args.locationAccuracy,
      timestamp: Date.now(),
      contactsNotified: args.contactIds,
      status: "pending",
    });
  },
});

export const updateSOSEventStatus = internalMutation({
  args: {
    sosEventId: v.id("sosEvents"),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.sosEventId, {
      status: args.status,
    });
  },
});

export const getActiveContactsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Array<Doc<"contacts">>> => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contacts.filter(contact => contact.isActive);
  },
});

export const sendSMSToContact = action({
  args: {
    phone: v.string(),
    name: v.string(),
    message: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Call the Node.js action for SMS sending
    return await ctx.runAction(internal.sms.sendSMS, args);
  },
});

export const getSOSHistory = query({
  args: {},
  handler: async (ctx): Promise<Array<Doc<"sosEvents">>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("sosEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
