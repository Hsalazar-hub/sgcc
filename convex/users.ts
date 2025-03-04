import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  query,
} from "./_generated/server";
import { roles } from "./schema";
import { hasAccessToOrg } from "./files";
import { Clerk, emails } from "@clerk/clerk-sdk-node";

const clerkSecret = process.env.CLERK_SECRET_KEY || `sk_test_68lCyPpiXvmrP0GppR42yI8abIcwrxqXCMiBrFpNGz`;

const clerkClient = Clerk({ apiKey: clerkSecret });
const clerk = process.env.NEXT_PUBLIC_CLERK_HOSTNAME || "fun-aphid-82.clerk.accounts.dev";

export async function getUser(
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier)
    )
    .first();

  if (!user) {
    throw new ConvexError("expected user to be defined");
  }

  return user;
}

export const createUser = internalMutation({
  args: { tokenIdentifier: v.string(), name: v.string(), image: v.string(), email: v.string() },
 
  async handler(ctx, args) { 
    await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      orgIds: [],
      name: args.name,
      image: args.image,
      email: args.email,
    });
    
  },
});

export const updateUser = internalMutation({
  args: { tokenIdentifier: v.string(), name: v.string(), image: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("no user with this token found");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      image: args.image,
    });
  },
});

export const addOrgIdToUser = internalMutation({
  args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const user = await getUser(ctx, args.tokenIdentifier);

    console.log("user:", user)
    console.log("args:", args)
    
    await ctx.db.patch(user._id, {
      orgIds: [...user.orgIds, { orgId: args.orgId, role: args.role }],     
    });
  },
});

export const updateRoleInOrgForUser = internalMutation({
  args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const user = await getUser(ctx, args.tokenIdentifier);

    const org = user.orgIds.find((org) => org.orgId === args.orgId);

    if (!org) {
      throw new ConvexError(
        "expected an org on the user but was not found when updating"
      );
    }

    org.role = args.role;

    await ctx.db.patch(user._id, {
      orgIds: user.orgIds,
    });
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    const user = await ctx.db.get(args.userId);

    return {
      name: user?.name,
      image: user?.image,
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

    const user = await getUser(ctx, identity.tokenIdentifier);

    if (!user) {
      return null;
    }

    return user;
  },
});


const getUserByEmail = async (email: string) => {
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (users.length === 0) {
      console.log(`No user found with email: ${email}`);
      return null;
    }

    const user = users[0];
    console.log("User Details:", user);
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
}

export const addOrgIdToUserByEmail = internalMutation({
  args: { email: v.string(), orgId: v.string(), role: roles },
  async handler(ctx, args) {
    const user = await getUserByEmail(args.email);

    if (!user) {
      throw new ConvexError("no user with this email found");
    }

    const tokenIdentifier = `https://${clerk}|${user.id}`;
    const aux = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier)
      )
      .first();

    if (!aux) {
      throw new ConvexError("no user with this token found");
    }
  
    await ctx.db.patch(aux._id, {
      orgIds: [...aux.orgIds, { orgId: args.orgId, role: args.role }],
    });
  },
});