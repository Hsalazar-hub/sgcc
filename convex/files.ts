import { ConvexError, v } from "convex/values";
import { useAction, useMutation } from "convex/react";
import { api,internal } from "./_generated/api";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { getUser } from "./users";
import { fileTypes, statusflag } from "./schema";
import { ptypes } from "./schema";
import { Doc, Id } from "./_generated/dataModel";
import { subDays,addDays } from "date-fns";
import { Resend } from "resend";
import emailjs from "@emailjs/browser"
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
    cname: v.optional(v.string()),
    cnumber: v.optional(v.string()),
    email: v.optional(v.string()),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: fileTypes,
    ptype: ptypes,
    expdate: v.float64(),
    monto: v.float64(),
    status: statusflag,
  },

  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("you do not have access to this org");
    }

    await ctx.db.insert("files", {
      name: args.name,
      cname: args.cname,
      cnumber: args.cnumber,
      email: args.email,
      orgId: args.orgId,
      monto: args.monto,
      fileId: args.fileId,
      type: args.type,
      expdate: args.expdate,
      userId: hasAccess.user._id,
      ptype: args.ptype,
      status: args.status==null ? "ongoing" : args.status,
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
    cname: v.optional(v.string()),
    cnumber: v.optional(v.string()),
    email: v.optional(v.string()),
    ptype: v.optional(ptypes),
    status: v.optional(v.string()),
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


export const getMontoGroupedByOrgId = query({
  args: {},
  async handler(ctx) {
    const files = await ctx.db.query("files").collect();

    const groupedByOrgId = files.reduce((acc, file) => {
      if (!acc[file.orgId]) {
        acc[file.orgId] = 0;
      }
      acc[file.orgId] += file.monto ?? 0;
      return acc;
    }, {} as Record<string, number>);

    return groupedByOrgId;
  },
});

export const notifyExpiredFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();
    const fiveDaysAfter = addDays(now, 5);

    // Obtener archivos expirados en los últimos 5 días
    const expiredFiles = await ctx.db
      .query("files")
      .withIndex(
        "by_expdate",
        (q) =>
          q.gte("expdate", now.getTime()).lte("expdate", fiveDaysAfter.getTime())
      )
      .collect();

    console.log("Archivos expirados encontrados:", expiredFiles.length);
    if (expiredFiles.length === 0) return;

    // Procesar correos en lotes (máx. 50 por iteración)
    const batchSize = 50;
    for (let i = 0; i < expiredFiles.length; i += batchSize) {
      const batch = expiredFiles.slice(i, i + batchSize);

      for (const file of batch) {
        // try {
        //   const emailArgs = {
        //     to: "hdsalazar20@gmail.com",
        //     subject: "Correo de prueba",
        //     body: `Este es un correo de prueba enviado con Resend y Convex. El archivo ${file.name} está a punto de expirar.`,
        //   };
        //   console.log("Calling sendEmail with args:", emailArgs);

        //   const action =  useAction(api.email.sendEmail);
        //   const result =  await action(emailArgs);


        //   console.log("Result from sendEmail:", result); // Log the result

        //   if (result.success) {
        //     console.log("Correo enviado con éxito:", result.response);
        //   } else {
        //     console.error("Error al enviar el correo:", result.error);
        //   }
        // } catch (error) {
        //   console.error("Error al enviar correo:", error);
        // }
      }
    }
  },
});

export const updateNearExpiredFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();
    const fiveDaysAfter = addDays(now, 5);
    console.log(fiveDaysAfter);
    // Obtener solo archivos que aún NO están en "nearexpired"
    const filesToUpdate = await ctx.db
      .query("files")
      .withIndex("by_expdate", (q) =>
        q.gte("expdate",  now.getTime()).lte("expdate", fiveDaysAfter.getTime()))
      .collect();

    console.log(`Archivos a marcar como nearexpired: ${filesToUpdate.length}`);
    if (filesToUpdate.length === 0) return;
    const aux = filesToUpdate.filter((file) => file.status !== "nearexpired" && file.expdate);
    // Actualizar en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < aux.length; i += batchSize) {
      const batch = aux.slice(i, i + batchSize);

      await Promise.all(
        batch.map((file) =>
          ctx.db.patch(file._id, { status: "nearexpired" }).catch((err) => console.error("Error al actualizar:", err))
        )
      );
    }
  },
});

export const updateExpiredFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();

    // Obtener solo archivos que aún NO están en "expired"
    const filesToUpdate = await ctx.db
      .query("files")
      .withIndex("by_expdate", (q) => q.lt("expdate", now.getTime()))
      .collect();

    console.log(`Archivos a marcar como expired: ${filesToUpdate.length}`);
    if (filesToUpdate.length === 0) return;

    const aux = filesToUpdate.filter((file) => file.status !== "expired" && file.expdate);
    // Actualizar en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < aux.length; i += batchSize) {
      const batch = aux.slice(i, i + batchSize);

      await Promise.all(
        batch.map((file) =>
          ctx.db.patch(file._id, { status: "expired" }).catch((err) => console.error("Error al actualizar:", err))
        )
      );
    }
  },
});

function assertCanDeleteFile(user: Doc<"users">, file: Doc<"files">) {
  const canDelete =
    file.userId === user._id ||
    user.orgIds.find((org) => org.orgId === file.orgId)?.role === "admin";

  if (!canDelete) {
    throw new ConvexError("No tiene permiso para borrar esta póliza");
  }
}



export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("No tiene acceso a esta póliza");
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
      throw new ConvexError("No tiene acceso a esta póliza");
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
      throw new ConvexError("No tiene acceso a esta póliza");
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
