import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const fileTypes = v.union(
  v.literal("image"),
  v.literal("csv"),
  v.literal("pdf"),
);

export const statusflag = v.optional(v.union(
  v.literal("ongoing"),
  v.literal("nearexpired"),
  v.literal("expired")
));


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
  polizas: defineTable({
    name: v.string(),
    type: fileTypes,
    monto: v.optional(v.float64()),
    orgId: v.string(),
    polizaId: v.id("_storage"),
    corredorId: v.id("corredores"),
    notified: v.optional(v.boolean()),
    cname: v.optional(v.string()),
    cnumber: v.optional(v.string()),
    ptype: ptypes,
    status: statusflag,
    important: v.optional(v.boolean()),
    email: v.optional(v.string()),
    shouldDelete: v.optional(v.boolean()),
    expdate: v.optional(v.float64())
  })
    .index("by_orgId", ["orgId"])
    .index("by_corredorId", ["corredorId"])
    .index("by_polizaId", ["polizaId"])
    .index("by_expdate", ["expdate"])
    .index("by_shouldDelete", ["shouldDelete"]),

  aseguradoras: defineTable({
    name: v.string(),
    orgId: v.string(),
  }).index("by_orgId", ["orgId"]),
  corredores: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    orgIds: v.array(
      v.object({
        orgId: v.string(),
        role: roles,
      })
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
});
