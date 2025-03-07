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
import { getcorredor } from "./corredores";
import { fileTypes, statusflag } from "./schema";
import { ptypes } from "./schema";
import { Doc, Id } from "./_generated/dataModel";
import { subDays,addDays } from "date-fns";
import { Resend } from "resend";
import emailjs from "@emailjs/browser"
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("debe estar autenticado para subir archivos");
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

  const corredor = await ctx.db
    .query("corredores")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!corredor) {
    return null;
  }

  const hasAccess =
    corredor.orgIds.some((item) => item.orgId === orgId) ||
    corredor.tokenIdentifier.includes(orgId);

  if (!hasAccess) {
    return null;
  }

  return { corredor };
}

export const createpoliza = mutation({
  args: {
    name: v.string(),
    cname: v.optional(v.string()),
    cnumber: v.optional(v.string()),
    email: v.optional(v.string()),
    polizaId: v.id("_storage"),
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

    await ctx.db.insert("polizas", {
      name: args.name,
      cname: args.cname,
      cnumber: args.cnumber,
      email: args.email,
      orgId: args.orgId,
      monto: args.monto,
      polizaId: args.polizaId,
      type: args.type,
      expdate: args.expdate,
      corredorId: hasAccess.corredor._id,
      ptype: args.ptype,
      status: args.status==null ? "ongoing" : args.status,
    });
  },
});




export const getpolizas = query({
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

    let polizas = await ctx.db
      .query("polizas")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const query = args.query;

    if (query) {
      polizas = polizas.filter((poliza) =>
        poliza.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (args.favorites) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_corredorId_orgId_polizaId", (q) =>
          q.eq("corredorId", hasAccess.corredor._id).eq("orgId", args.orgId)
        )
        .collect();

      polizas = polizas.filter((poliza) =>
        favorites.some((favorite) => favorite.polizaId === poliza._id)
      );
    }

    if (args.deletedOnly) {
      polizas = polizas.filter((poliza) => poliza.shouldDelete);
    } else {
      polizas = polizas.filter((poliza) => !poliza.shouldDelete);
    }

    if (args.type) {
      polizas = polizas.filter((poliza) => poliza.type === args.type);
    }
    if (args.ptype) {
      polizas = polizas.filter((poliza) => poliza.ptype === args.ptype);
    }

    const polizasWithUrl = await Promise.all(
      polizas.map(async (poliza) => ({
        ...poliza,
        url: await ctx.storage.getUrl(poliza.polizaId),
      }))
    );

    return polizasWithUrl;
  },
});

export const deleteAllpolizas = internalMutation({
  args: {},
  async handler(ctx) {
    const polizas = await ctx.db
      .query("polizas")
      .withIndex("by_shouldDelete", (q) => q.eq("shouldDelete", true))
      .collect();

    await Promise.all(
      polizas.map(async (poliza) => {
        await ctx.storage.delete(poliza.polizaId);
        return await ctx.db.delete(poliza._id);
      })
    );
  },
});



export const updateNearExpiredpolizas = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();
    const fiveDaysAfter = addDays(now, 5);
    console.log(fiveDaysAfter);
    // Obtener solo archivos que aún NO están en "nearexpired"
    const polizasToUpdate = await ctx.db
      .query("polizas")
      .withIndex("by_expdate", (q) =>
        q.gte("expdate",  now.getTime()).lte("expdate", fiveDaysAfter.getTime()))
      .collect();

    console.log(`Archivos a marcar como nearexpired: ${polizasToUpdate.length}`);
    if (polizasToUpdate.length === 0) return;
    const aux = polizasToUpdate.filter((poliza) => poliza.status !== "nearexpired" && poliza.expdate);
    // Actualizar en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < aux.length; i += batchSize) {
      const batch = aux.slice(i, i + batchSize);

      await Promise.all(
        batch.map((poliza) =>
          ctx.db.patch(poliza._id, { status: "nearexpired" }).catch((err) => console.error("Error al actualizar:", err))
        )
      );
    }
  },
});

export const updateExpiredpolizas = internalMutation({
  args: {},
  async handler(ctx) {
    const now = new Date();

    // Obtener solo archivos que aún NO están en "expired"
    const polizasToUpdate = await ctx.db
      .query("polizas")
      .withIndex("by_expdate", (q) => q.lt("expdate", now.getTime()))
      .collect();

    console.log(`Archivos a marcar como expired: ${polizasToUpdate.length}`);
    if (polizasToUpdate.length === 0) return;

    const aux = polizasToUpdate.filter((poliza) => poliza.status !== "expired" && poliza.expdate);
    // Actualizar en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < aux.length; i += batchSize) {
      const batch = aux.slice(i, i + batchSize);

      await Promise.all(
        batch.map((poliza) =>
          ctx.db.patch(poliza._id, { status: "expired" }).catch((err) => console.error("Error al actualizar:", err))
        )
      );
    }
  },
});
function assertCanDeletepoliza(corredor: Doc<"corredores">, poliza: Doc<"polizas">) {
  const canDelete =
    poliza.corredorId === corredor._id ||
    corredor.orgIds.some((org) => org.orgId === poliza.orgId && org.role === "admin");
    console.log("canDelete: ", canDelete);
  if (!canDelete) {
    throw new ConvexError("No tiene permiso para borrar esta póliza");
  }
}


export const deletepoliza = mutation({
  args: { polizaId: v.id("polizas") },
  async handler(ctx, args) {
    const access = await hasAccessTopoliza(ctx, args.polizaId);

    if (!access) {
      throw new ConvexError("No tiene acceso a esta póliza");
    }

    assertCanDeletepoliza(access.corredor, access.poliza);

    await ctx.db.patch(args.polizaId, {
      shouldDelete: true,
    });
  },
});

export const restorepoliza = mutation({
  args: { polizaId: v.id("polizas") },
  async handler(ctx, args) {
    const access = await hasAccessTopoliza(ctx, args.polizaId);

    if (!access) {
      throw new ConvexError("No tiene acceso a esta póliza");
    }

    assertCanDeletepoliza(access.corredor, access.poliza);

    await ctx.db.patch(args.polizaId, {
      shouldDelete: false,
    });
  },
});

export const toggleFavorite = mutation({
  args: { polizaId: v.id("polizas") },
  async handler(ctx, args) {
    const access = await hasAccessTopoliza(ctx, args.polizaId);

    if (!access) {
      throw new ConvexError("No tiene acceso a esta póliza");
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_corredorId_orgId_polizaId", (q) =>
        q
          .eq("corredorId", access.corredor._id)
          .eq("orgId", access.poliza.orgId)
          .eq("polizaId", access.poliza._id)
      )
      .first();

    if (!favorite) {
      await ctx.db.insert("favorites", {
        polizaId: access.poliza._id,
        corredorId: access.corredor._id,
        orgId: access.poliza.orgId,
      });
    } else {
      await ctx.db.delete(favorite._id);
    }
  },
});



 export const notifyExpiredpolizas = internalMutation({
  args: {},
  async handler(ctx) {
    try {
      const now = new Date();
      const fiveDaysAfter = addDays(now, 5);
  
      // Obtener archivos expirados en los últimos 5 días
      const expiredpolizas = await ctx.db
        .query("polizas")
        .withIndex(
          "by_expdate",
          (q) =>
            q.gte("expdate", now.getTime()).lte("expdate", fiveDaysAfter.getTime())
        )
        .collect();
  
        const filteredExpiredpolizas = expiredpolizas.filter((poliza) => !poliza.notified);

      console.log("Pólizas por notificar encontrados:", filteredExpiredpolizas.length);
      if (filteredExpiredpolizas.length === 0) return [];
      return filteredExpiredpolizas;
  
    } catch (error) {
      console.error(error);
      return []
      
    }
   
      }
    }
  
  ,
);


export const getAllFavorites = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_corredorId_orgId_polizaId", (q) =>
        q.eq("corredorId", hasAccess.corredor._id).eq("orgId", args.orgId)
      )
      .collect();

    return favorites;
  },
});

async function hasAccessTopoliza(
  ctx: QueryCtx | MutationCtx,
  polizaId: Id<"polizas">
) {
  const poliza = await ctx.db.get(polizaId);

  if (!poliza) {
    return null;
  }

  const hasAccess = await hasAccessToOrg(ctx, poliza.orgId);

  if (!hasAccess) {
    return null;
  }

  return { corredor: hasAccess.corredor, poliza };
}
