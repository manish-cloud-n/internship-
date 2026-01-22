import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),
  
  sosEvents: defineTable({
    userId: v.id("users"),
    message: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    timestamp: v.number(),
    contactsNotified: v.array(v.id("contacts")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
  }).index("by_user", ["userId"]),
  
  userSettings: defineTable({
    userId: v.id("users"),
    defaultMessage: v.string(),
    enableGPS: v.boolean(),
    autoSendDelay: v.number(), // seconds before auto-send
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
