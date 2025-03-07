"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FileIcon, StarIcon, TrashIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        variant={"outline"}
        className="sm:hidden"
        onClick={toggleNav}
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </Button>
      <div
        className={clsx(
          "w-full sm:w-40 flex flex-col gap-4 p-4 sm:p-0",
          {
            "block": isOpen,
            "hidden sm:block": !isOpen,
          }
        )}
      >
        <Link href="/dashboard/polizas">
          <Button
            variant={"link"}
            className={clsx("flex gap-2", {
              "text-blue-500": pathname.includes("/dashboard/polizas"),
            })}
          >
            <FileIcon /> Todas las Pólizas
          </Button>
        </Link>
            
            
        <Link href="/dashboard/favorites">
          <Button
            variant={"link"}
            className={clsx("flex gap-2", {
              "text-blue-500": pathname.includes("/dashboard/favorites"),
            })}
          >
            <StarIcon /> Importantes
          </Button>
        </Link>

        <Link href="/dashboard/trash">
          <Button
            variant={"link"}
            className={clsx("flex gap-2", {
              "text-blue-500": pathname.includes("/dashboard/trash"),
            })}
          >
            <TrashIcon /> Basura
          </Button>
        </Link>
      </div>
    </div>
  );
}