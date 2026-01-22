"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const sendSMS = internalAction({
  args: {
    phone: v.string(),
    name: v.string(),
    message: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    let fullMessage = `🚨 EMERGENCY ALERT 🚨\n\n${args.message}`;
    
    if (args.latitude && args.longitude) {
      const mapsUrl = `https://maps.google.com/maps?q=${args.latitude},${args.longitude}`;
      fullMessage += `\n\nLocation: ${mapsUrl}`;
    }

    fullMessage += `\n\nThis is an automated emergency message. Please respond immediately.`;

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: args.phone,
          Body: fullMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio API error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Failed to send SMS to ${args.phone}:`, error);
      throw error;
    }
  },
});
