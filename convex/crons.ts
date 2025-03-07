import { cronJobs } from "convex/server";
import { api,internal } from "./_generated/api";


const crons = cronJobs();

crons.interval(
  "delete any old files marked for deletion",
  { minutes: 25 },
  internal.polizas.deleteAllpolizas
);

crons.interval(
  "notify users of expired files",
  { minutes: 1},  // Se ejecuta cada hora para reducir la carga
  internal.polizas.notifyExpiredpolizas
  
);

crons.interval(
  "Update files to expired",
  { minutes: 1 },
  internal.polizas.updateExpiredpolizas
);


crons.interval(
  "Update files to near expired",
  { minutes: 1 },
  internal.polizas.updateNearExpiredpolizas
 
);


crons.interval(
  "Send email",
  { seconds: 20 },
  api.email.sendEmail
 
);
export default crons;
