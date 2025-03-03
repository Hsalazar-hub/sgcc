import { Button } from "@/components/ui/button";
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useSession,
  SignOutButton
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/router';

export function Header() {
  const router = useRouter();
  return (
    <div className="relative z-10 border-b py-4 bg-gray-50">
      <div className="items-center container mx-auto justify-between flex">
        <Link href="/" className="flex gap-2 items-center text-xl text-black">
          <Image src="/logo.png" width="50" height="50" alt="file drive logo" />
          SGCS
        </Link>

        <SignedIn>
          <Button variant={"outline"}>
            <Link href="/dashboard/files">Tus Pólizas</Link>
          </Button>
        </SignedIn>

        <div className="flex gap-2">
          <OrganizationSwitcher />
          <SignedIn>
          <SignOutButton>
              <Button onClick={() => router.push('/layout')}>Cerrar sesión</Button>
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
