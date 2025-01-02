import { authMiddleware, redirectToSignUp } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server"


export default authMiddleware({
  afterAuth(auth, req:NextRequest, evt) {
    //console.log('Auth Response:', auth);
  
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!auth || auth.orgRole !== 'admin') {
        //console.error("Acceso denegado: Usuario no es administrador o no autenticado");
        const redirectUrl = `${req.nextUrl.origin}/`;
        return NextResponse.redirect(redirectUrl);
      } else {
        //console.log('AUTH.ORG.ROLE:', auth.orgRole);
      }
    }
  },
  
  publicRoutes: ["/"],
  
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
