import { authMiddleware, redirectToSignUp } from "@clerk/nextjs";
import { NextRequest } from "next/server"


export default authMiddleware({
  
  publicRoutes: ["/"],
  
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
