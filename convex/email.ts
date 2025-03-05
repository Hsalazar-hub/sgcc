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
      const expiredFiles = await ctx.runQuery(internal.email.notifyExpiredFiles, {}
      );

      const sentlist = [];
      for (const file of expiredFiles) {

        try {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "hdsalazar20@gmail.com",
               subject: "Su poliza de seguro está a punto de expirar",
                html: `Este es un correo de prueba enviado con Resend y Convex. La póliza <strong> ${file.name}</strong> está a punto de expirar.`,
          });
          sentlist.push(file._id);
        } catch (error) {
          console.error(error);
        }
      
      }
      await ctx.runMutation(internal.email.markFilesAsNotified, { ids: sentlist });

    } catch (error) {
      console.log(error);
    }
  },
});


 export const notifyExpiredFiles = internalQuery({
  args: {},
  async handler(ctx) {
    try {
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
  
        const filteredExpiredFiles = expiredFiles.filter((file) => !file.notified);

      console.log("Pólizas por notificar encontrados:", filteredExpiredFiles.length);
      if (filteredExpiredFiles.length === 0) return [];
      return filteredExpiredFiles;
  
    } catch (error) {
      console.error(error);
      return []
      
    }
   
      }
    }
  
  ,
);

export const markFilesAsNotified = internalMutation({
  args: { ids: v.array(v.any()) },

  async handler(ctx, args) {
    try {
      Promise.all(args.ids.map(( id ) => ctx.db.patch(id, {notified: true  })));
      
   
    } catch (error) {
      console.error(error);
    }
  },

});