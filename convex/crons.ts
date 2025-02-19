import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "delete any old files marked for deletion",
  { minutes: 1 },
  internal.files.deleteAllFiles
);

crons.interval(
  "notify users of expired files",
  { minutes: 1 },  // Se ejecuta cada hora para reducir la carga
  internal.files.notifyExpiredFiles
);
export default crons;
