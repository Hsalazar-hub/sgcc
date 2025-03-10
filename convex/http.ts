import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    
    const payloadString = await request.text();
    const headerPayload = request.headers;
    const clerk = process.env.NEXT_PUBLIC_CLERK_HOSTNAME || "fun-aphid-82.clerk.accounts.dev";

    try {
      const result = await ctx.runAction(internal.clerk.fulfill, {
        payload: payloadString,
        headers: {
          "svix-id": headerPayload.get("svix-id")!,
          "svix-timestamp": headerPayload.get("svix-timestamp")!,
          "svix-signature": headerPayload.get("svix-signature")!,
        },
      });

      switch (result.type) {
        case "user.created":
          await ctx.runMutation(internal.corredores.createcorredor, {
            tokenIdentifier: `https://${clerk}|${result.data.id}`,
            name: `${result.data.first_name ?? ""} ${
              result.data.last_name ?? ""
            }`,
            image: result.data.image_url,
            email: result.data.email_addresses[0].email_address,
          });
          break;
        case "user.updated":
          await ctx.runMutation(internal.corredores.updatecorredor, {
            tokenIdentifier: `https://${clerk}|${result.data.id}`,
            name: `${result.data.first_name ?? ""} ${
              result.data.last_name ?? ""
            }`,
            image: result.data.image_url,
          });
          break;
        case "organizationMembership.created":
          console.log("result: ", result);
          
          await ctx.runMutation(internal.corredores.addOrgIdTocorredor, {
            tokenIdentifier: `https://${clerk}|${result.data.public_user_data.user_id}`,
            orgId: result.data.organization.id,
            role: result.data.role === "org:admin" ? "admin" : "member",
          });

          break;
          
        case "organizationMembership.updated":
       
          await ctx.runMutation(internal.corredores.updateRoleInOrgForcorredor, {
            tokenIdentifier: `https://${clerk}|${result.data.public_user_data.user_id}`,
            orgId: result.data.organization.id,
            role: result.data.role === "org:admin" ? "admin" : "member",
          });
          break;
        case "organizationInvitation.accepted":
          await ctx.runMutation(internal.corredores.addOrgIdTocorredorByEmail, {
            email: result.data.email_address,
            orgId: result.data.organization_id,
            role: result.data.role === "org:admin" ? "admin" : "member",
          });
          break;
      }

      return new Response(null, {
        status: 200,
      });
    } catch (err) {
      console.log('err: ', err);

      return new Response("Webhook Error", {
        status: 400,
      });
    }
  }),
});

export default http;
