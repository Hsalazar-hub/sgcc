import { Button } from "@/components/ui/button";
import { RedirectUrl } from "@clerk/clerk-sdk-node";
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useSession,
  useClerk,
  SignOutButton
} from "@clerk/nextjs";
import { redirect } from "next/dist/server/api-utils";
import Image from "next/image";
import Link from "next/link";



export function Header() {


  return (
    <div className="relative z-10 border-b py-4 bg-gray-50">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <Link href="/" className="flex gap-2 items-center text-xl text-black">
          <Image src="/logo.png" width="50" height="50" alt="file drive logo" />
          SGCS
        </Link>
 <div className="flex flex-wrap items-center gap-2">
          <SignedIn>
            <Button variant={"outline"}>
              <Link href="/dashboard/files">Tus Pólizas</Link>
            </Button>
          </SignedIn>

          <OrganizationSwitcher />

          <SignedIn>
            <SignOutButton>
           
              <Button>Cerrar sesión</Button>
              </SignOutButton>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button>Iniciar sesión</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}