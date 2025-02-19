import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const fileTypes = v.union(
  v.literal("image"),
  v.literal("csv"),
  v.literal("pdf")
);

export const ptypes = v.optional(v.union(
  v.literal("HCM"),
  v.literal("Vehiculo"),
  v.literal("RCV de vehículos"),
  v.literal("RCV de embarcacion"),
  v.literal("RCV de aviación"),
  v.literal("Incendios"),
  v.literal("Combinado Residencial"),
  v.literal("Accidentes personales"),
  v.literal("Poliza de vida"),
  v.literal("Poliza Empresarial"),

))

export const roles = v.union(v.literal("admin"), v.literal("member"));

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: fileTypes,
    monto: v.optional(v.float64()),
    orgId: v.string(),
    fileId: v.id("_storage"),
    userId: v.id("users"),
    ptype: ptypes,
    shouldDelete: v.optional(v.boolean()),
    expdate: v.optional(v.float64())
  })
    .index("by_orgId", ["orgId"])
    .index("by_expdate", ["expdate"])
    .index("by_shouldDelete", ["shouldDelete"]),
  favorites: defineTable({
    fileId: v.id("files"),
    orgId: v.string(),
    userId: v.id("users"),
  }).index("by_userId_orgId_fileId", ["userId", "orgId", "fileId"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    orgIds: v.array(
      v.object({
        orgId: v.string(),
        role: roles,
      })
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
});
