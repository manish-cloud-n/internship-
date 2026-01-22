import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addContact = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(args.phone)) {
      throw new Error("Invalid phone number format");
    }

    return await ctx.db.insert("contacts", {
      userId,
      name: args.name.trim(),
      phone: args.phone.replace(/\s/g, ""), // Remove spaces
      relationship: args.relationship.trim(),
      isActive: true,
    });
  },
});

export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(args.phone)) {
      throw new Error("Invalid phone number format");
    }

    await ctx.db.patch(args.contactId, {
      name: args.name.trim(),
      phone: args.phone.replace(/\s/g, ""),
      relationship: args.relationship.trim(),
      isActive: args.isActive,
    });
  },
});

export const deleteContact = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    await ctx.db.delete(args.contactId);
  },
});

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getActiveContacts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return contacts.filter(contact => contact.isActive);
  },
});
