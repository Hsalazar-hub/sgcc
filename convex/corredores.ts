import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  query,
} from "./_generated/server";
import { roles } from "./schema";
import { hasAccessToOrg } from "./polizas";
import { Clerk, emails } from "@clerk/clerk-sdk-node";

const clerkSecret = process.env.CLERK_SECRET_KEY || `sk_test_68lCyPpiXvmrP0GppR42yI8abIcwrxqXCMiBrFpNGz`;

const clerkClient = Clerk({ apiKey: clerkSecret });
const clerk = process.env.NEXT_PUBLIC_CLERK_HOSTNAME || "fun-aphid-82.clerk.accounts.dev";

export async function getcorredor(
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string
) {
  const corredor = await ctx.db
    .query("corredores")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier)
    )
    .first();

  if (!corredor) {
    throw new ConvexError("expected corredor to be defined");
  }

  return corredor;
}

export const createcorredor = internalMutation({
  args: { tokenIdentifier: v.string(), name: v.string(), image: v.string(), email: v.string() },
 
  async handler(ctx, args) { 
    await ctx.db.insert("corredores", {
      tokenIdentifier: args.tokenIdentifier,
      orgIds: [],
      name: args.name,
      image: args.image,
      email: args.email,
    });
    
  },
});

export const updatecorredor = internalMutation({
  args: { tokenIdentifier: v.string(), name: v.string(), image: v.string() },
  async handler(ctx, args) {
    const corredor = await ctx.db
      .query("corredores")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();

    if (!corredor) {
      throw new ConvexError("no corredor with this token found");
    }

    await ctx.db.patch(corredor._id, {
      name: args.name,
      image: args.image,
    });
  },
});

export const addOrgIdTocorredor = internalMutation({
  args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const corredor = await getcorredor(ctx, args.tokenIdentifier);

    console.log("corredor:", corredor)
    console.log("args:", args)
    
    await ctx.db.patch(corredor._id, {
      orgIds: [...corredor.orgIds, { orgId: args.orgId, role: args.role }],     
    });
  },
});

export const updateRoleInOrgForcorredor = internalMutation({
  args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const corredor = await getcorredor(ctx, args.tokenIdentifier);

    const org = corredor.orgIds.find((org) => org.orgId === args.orgId);

    if (!org) {
      throw new ConvexError(
        "expected an org on the corredor but was not found when updating"
      );
    }

    org.role = args.role;

    await ctx.db.patch(corredor._id, {
      orgIds: corredor.orgIds,
    });
  },
});

export const getUserProfile = query({
  args: { corredorId: v.id("corredores") },
  async handler(ctx, args) {
    const corredor = await ctx.db.get(args.corredorId);

    return {
      name: corredor?.name,
      image: corredor?.image,
    };
  },
});

export const getMe = query({
  args: {},
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const corredor = await getcorredor(ctx, identity.tokenIdentifier);

    if (!corredor) {
      return null;
    }

    return corredor;
  },
});


const getcorredorByEmail = async (email: string) => {
  try {
    const corredores = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (corredores.length === 0) {
      console.log(`No corredor found with email: ${email}`);
      return null;
    }

    const corredor = corredores[0];
    console.log("corredor Details:", corredor);
    return corredor;
  } catch (error) {
    console.error("Error fetching corredor by email:", error);
    throw error;
  }
}

export const addOrgIdTocorredorByEmail = internalMutation({
  args: { email: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const corredor = await getcorredorByEmail(args.email);

    if (!corredor) {
      throw new ConvexError("no corredor with this email found");
    }

    const tokenIdentifier = `https://${clerk}|${corredor.id}`;
    const aux = await ctx.db
      .query("corredores")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier)
      )
      .first();

    if (!aux) {
      throw new ConvexError("no corredor with this token found");
    }
  
    await ctx.db.patch(aux._id, {
      orgIds: [...aux.orgIds, { orgId: args.orgId, role: args.role }],
    });
  },
});