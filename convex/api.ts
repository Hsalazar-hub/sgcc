import { anyApi}  from "convex/server";
import { sendEmail } from "./email";

export const api = {
    email: {
      sendEmail,
    },
  };
  
export const internal = anyApi;