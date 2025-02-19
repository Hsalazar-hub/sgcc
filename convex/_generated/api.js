/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { anyApi } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api = anyApi;
export const internal = anyApi;


export const sendEmail = internalAction({
  args: {
    to: "string",
    subject: "string",
    body: "string",
  },
  handler: async ({ args }) => {
    try {
      const { to, subject, body } = args;

      const response = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to,
        subject,
        html: `<p>${body}</p>`,
      });

      return { success: true, response };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  },
});