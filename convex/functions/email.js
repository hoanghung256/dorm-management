// convex/functions/email.js
// Provider-agnostic email sender stub. Replace implementation with your provider.
import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, { to, subject, html }) => {
    // TODO: Integrate with an actual email provider (Resend, SendGrid, etc.)
    console.log("[Email stub] to=", to.join(","), "subject=", subject);
    // Return a fake message id
    return { id: `stub-${Date.now()}` };
  }
});
