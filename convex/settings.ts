import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Return default settings if none exist
    return settings || {
      defaultMessage: "I need immediate help! This is an emergency. Please contact me or call emergency services.",
      enableGPS: true,
      autoSendDelay: 5,
    };
  },
});

export const updateUserSettings = mutation({
  args: {
    defaultMessage: v.string(),
    enableGPS: v.boolean(),
    autoSendDelay: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        defaultMessage: args.defaultMessage,
        enableGPS: args.enableGPS,
        autoSendDelay: args.autoSendDelay,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        defaultMessage: args.defaultMessage,
        enableGPS: args.enableGPS,
        autoSendDelay: args.autoSendDelay,
      });
    }
  },
});
