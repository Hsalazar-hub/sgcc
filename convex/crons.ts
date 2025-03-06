import { cronJobs } from "convex/server";
import { api,internal } from "./_generated/api";


const crons = cronJobs();

crons.interval(
  "delete any old files marked for deletion",
  { minutes: 25 },
  internal.files.deleteAllFiles
);

crons.interval(
  "notify users of expired files",
  { minutes: 1},  // Se ejecuta cada hora para reducir la carga
  internal.files.notifyExpiredFiles
  
);

crons.interval(
  "Update files to expired",
  { minutes: 1 },
  internal.files.updateExpiredFiles
);


crons.interval(
  "Update files to near expired",
  { minutes: 1 },
  internal.files.updateNearExpiredFiles
 
);


crons.interval(
  "Send email",
  { seconds: 20 },
  api.email.sendEmail
 
);
export default crons;
