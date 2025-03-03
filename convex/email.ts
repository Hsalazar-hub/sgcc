import { internalMutation } from "./_generated/server";
import { Resend } from "resend";
export const resend = new Resend("re_Xeq6c2mE_14iuFx8Tt4NqnEHZDKj75XCX");
import { v } from "convex/values";

export const sendEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args ) => {
    try {
      console.log("Received args:", args); // Log the received args
      if (!args) {
        throw new Error("Args are undefined");
      }
      const { to, subject, body } = args;

      console.log("Destructured args:", { to, subject, body }); // Log destructured args

      const response = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to,
        subject,
        html: `<p>${body}</p>`,
      });

      return { success: true, response };
    } catch (error: any) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  },
});