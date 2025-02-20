import { internalAction, internalMutation, mutation } from "./_generated/server";
import { Resend } from "resend";
export const resend = new Resend("re_Xeq6c2mE_14iuFx8Tt4NqnEHZDKj75XCX")
import {v} from "convex/values";
export const sendEmail = internalMutation({
    args: {
      to: v.string(),
      subject: v.string(),
      body: v.string(),
    },
    handler: async ({ args }:any) => {
      try {
        const { to, subject, body } = args;
  
        const response = await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to,
          subject,
          html: `<p>${body}</p>`,
        });
  
        return { success: true, response };
      } catch (error:any) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
      }
    },
  });