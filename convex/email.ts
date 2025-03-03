
import { action, internalMutation, mutation, query } from "./_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";

import emailjs from "@emailjs/browser" // Asegúrate de importar emailjs

export const sendEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { to, subject, body } = args;

      // Configuración de EmailJS (asegúrate de usar tu servicio y plantilla)
      const serviceID = 'service_dqvf926'; // Reemplaza con tu service ID de EmailJS
      const templateID = 'template_f0bcxh9'; // Reemplaza con tu template ID de EmailJS
      const userID = 'Ggl_OXBeB_FQQe9Gc'; // Reemplaza con tu user ID de EmailJS

      // Parámetros del correo
      const templateParams = {
        to_email: to,
        subject,
        body,
      };

      // Enviar correo con EmailJS
      const response = await emailjs.send(serviceID, templateID, templateParams, userID);

      return { success: true, response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});