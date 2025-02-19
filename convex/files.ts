import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { getUser } from "./users";
import { fileTypes } from "./schema";
import { ptypes } from "./schema";
import { Doc, Id } from "./_generated/dataModel";
import { subDays } from 'date-fns';
import {Resend} from "resend";


export const resend = new Resend("re_Xeq6c2mE_14iuFx8Tt4NqnEHZDKj75XCX")

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("you must be logged in to upload a file");
  }

  return await ctx.storage.generateUploadUrl();
});

export async function hasAccessToOrg(
  ctx: QueryCtx | MutationCtx,
  orgId: string
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    return null;
  }

  const hasAccess =
    user.orgIds.some((item) => item.orgId === orgId) ||
    user.tokenIdentifier.includes(orgId);


  if (!hasAccess) {
    return null;
  }

  return { user };
}

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: fileTypes,
    ptype: ptypes,
    expdate: v.float64(),
    monto: v.float64(),
  },

  async handler(ctx, args) {

    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("you do not have access to this org");
    }

    await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId,
      monto: args.monto,
      fileId: args.fileId,
      type: args.type,
      expdate: args.expdate,
      userId: hasAccess.user._id,
      ptype: args.ptype,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorites: v.optional(v.boolean()),
    deletedOnly: v.optional(v.boolean()),
    type: v.optional(fileTypes),
    ptype: v.optional(ptypes),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    let files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const query = args.query;

    if (query) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (args.favorites) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
        )
        .collect();

      files = files.filter((file) =>
        favorites.some((favorite) => favorite.fileId === file._id)
      );
    }

    if (args.deletedOnly) {
      files = files.filter((file) => file.shouldDelete);
    } else {
      files = files.filter((file) => !file.shouldDelete);
    }

    if (args.type) {
      files = files.filter((file) => file.type === args.type);
    }
    if (args.ptype) {
      files = files.filter((file) => file.ptype === args.ptype);
    }

    const filesWithUrl = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );

    return filesWithUrl;
  },
});

export const deleteAllFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const files = await ctx.db
      .query("files")
      .withIndex("by_shouldDelete", (q) => q.eq("shouldDelete", true))
      .collect();

    await Promise.all(
      files.map(async (file) => {
        await ctx.storage.delete(file.fileId);
        return await ctx.db.delete(file._id);
      })
    );
  },
});


export const notifyExpiredFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();
    const fiveDaysBefore = subDays(now, 5);

    // Obtener archivos expirados en los últimos 5 días
    const expiredFiles = await ctx.db
      .query("files")
      .withIndex("by_expdate", (q) =>
        q.gte("expdate", fiveDaysBefore.getTime()) //.lt("expdate", now.getTime())
      )
      .collect();
      console.log(expiredFiles.length)
    if (expiredFiles.length === 0) return;

    // Procesar correos en lotes (máx. 50 por iteración)
    const batchSize = 50;
    for (let i = 0; i < expiredFiles.length; i += batchSize) {
      const batch = expiredFiles.slice(i, i + batchSize);

      for (const file of batch) {
        try {
          fetch("https://api.resend.dev/v1/emails/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: "hdsalazar20@gmail.com",
              from: "Acme <onboarding@resend.dev>",
              subject: "Tu póliza está a punto de expirar",
              html: `<p>Su póliza <strong>${file.name}</strong> está a punto de expirar, por favor esté atento!</p>`,
            }),
          }).then((res) => {
            if (!res.ok) {
              throw new Error("Error al enviar correo");
            }
          });

          // const {data, error} = await resend.emails.send({
          //   to: "hdsalazar20@gmail.com", 
          //   from: "Acme <onboarding@resend.dev>",
          //   subject: "Tu póliza está a punto de expirar",
          //  // react: undefined,
          //  html: `<p>Su póliza <strong>${file.name}</strong> está a punto de expirar, por favor esté atento!</p>`,
          //  }) 
          //  console.log(error)
        } catch (error) {
          console.error("Error al enviar correo:", error);
        }
      }
    }
  },
});

function assertCanDeleteFile(user: Doc<"users">, file: Doc<"files">) {
  const canDelete =
    file.userId === user._id ||
    user.orgIds.find((org) => org.orgId === file.orgId)?.role === "admin";

  if (!canDelete) {
    throw new ConvexError("you have no acces to delete this file");
  }
}

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: true,
    });
  },
});

export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: false,
    });
  },
});

export const toggleFavorite = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q
          .eq("userId", access.user._id)
          .eq("orgId", access.file.orgId)
          .eq("fileId", access.file._id)
      )
      .first();

    if (!favorite) {
      await ctx.db.insert("favorites", {
        fileId: access.file._id,
        userId: access.user._id,
        orgId: access.file.orgId,
      });
    } else {
      await ctx.db.delete(favorite._id);
    }
  },
});

export const getAllFavorites = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
      )
      .collect();

    return favorites;
  },
});

async function hasAccessToFile(
  ctx: QueryCtx | MutationCtx,
  fileId: Id<"files">
) {
  const file = await ctx.db.get(fileId);

  if (!file) {
    return null;
  }

  const hasAccess = await hasAccessToOrg(ctx, file.orgId);

  if (!hasAccess) {
    return null;
  }

  return { user: hasAccess.user, file };
}


