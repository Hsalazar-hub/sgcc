import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

function findKeyRecursively(obj: any, keyToFind: string) {
  if (!obj || typeof obj !== "object") return null;

  for (const key of Object.keys(obj)) {
    if (key === keyToFind) {
      return obj[key];
    }
    const nestedResult: any = findKeyRecursively(obj[key], keyToFind);
    if (nestedResult !== null) {
      return nestedResult;
    }
  }
  return null;
}

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

      console.log('result: ', result);

      switch (result.type) {
        case "user.created":
          await ctx.runMutation(internal.users.createUser, {
            tokenIdentifier: `https://${clerk}|${result.data.id}`,
            name: `${result.data.first_name ?? ""} ${
              result.data.last_name ?? ""
            }`,
            image: result.data.image_url,
          });
          break;
        case "user.updated":
          await ctx.runMutation(internal.users.updateUser, {
            tokenIdentifier: `https://${clerk}|${result.data.id}`,
            name: `${result.data.first_name ?? ""} ${
              result.data.last_name ?? ""
            }`,
            image: result.data.image_url,
          });
          break;
        case "organizationMembership.created":
          console.log("result completo: ", JSON.stringify(result, null, 2));

          const orgId = findKeyRecursively(result.data, "organization_id");
          console.log("Organization ID encontrado:", orgId);
        
          await ctx.runMutation(internal.users.addOrgIdToUser, {
            tokenIdentifier: `https://${clerk}|${result.data.public_user_data.user_id}`,
            orgId,
            role: result.data.role === "org:admin" ? "admin" : "member",
          });

          break;
        case "organizationMembership.updated":
       
          await ctx.runMutation(internal.users.updateRoleInOrgForUser, {
            tokenIdentifier: `https://${clerk}|${result.data.public_user_data.user_id}`,
            orgId: result.data.organization.id,
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
