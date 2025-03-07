import { action, internalMutation, internalQuery } from "./_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { addDays } from "date-fns";


export const sendEmail = action({
  args: {
  
  },
  handler: async (ctx) => {
 
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const expiredpolizas = await ctx.runQuery(internal.email.notifyExpiredpolizas, {}
      );

      const sentlist = [];
      for (const poliza of expiredpolizas) {

        try {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "hdsalazar20@gmail.com",
               subject: "Su poliza de seguro está a punto de expirar",
                html: `Este es un correo de prueba enviado con Resend y Convex. La póliza <strong> ${poliza.name}</strong> está a punto de expirar.`,
          });
          sentlist.push(poliza._id);
        } catch (error) {
          console.error(error);
        }
      
      }
      await ctx.runMutation(internal.email.markpolizasAsNotified, { ids: sentlist });

    } catch (error) {
      console.log(error);
    }
  },
});


 export const notifyExpiredpolizas = internalQuery({
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

export const markpolizasAsNotified = internalMutation({
  args: { ids: v.array(v.any()) },

  async handler(ctx, args) {
    try {
      Promise.all(args.ids.map(( id ) => ctx.db.patch(id, {notified: true  })));
      
   
    } catch (error) {
      console.error(error);
    }
  },

});