"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { formatRelative } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PolizaCardActions } from "./poliza-actions";
import { UserProfile } from "@clerk/clerk-react";


function UserCell({ corredorId }: { corredorId: Id<"corredores"> }) {
  const UserProfile = useQuery(api.corredores.getUserProfile, {
    corredorId: corredorId,
  });
  return (
    <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
      <Avatar className="w-6 h-6">
        <AvatarImage src={UserProfile?.image} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      {UserProfile?.name}
    </div>
  );
}

export const columns: ColumnDef<
  Doc<"polizas"> & { isFavorited: boolean; url: string | null }
>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="truncate max-w-xs">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="truncate max-w-xs">{row.original.ptype}</div>
    ),
  },
  {
    header: "Usuario",
    cell: ({ row }) => {
      return <UserCell corredorId={row.original.corredorId} />;
    },
  },
  {
    header: "Súbida el",
    cell: ({ row }) => {
      return (
        <div className="truncate max-w-xs">
          {formatRelative(new Date(row.original._creationTime), new Date())}
        </div>
      );
    },
  },
  {
    header: "Acciones",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <PolizaCardActions
            poliza={row.original}
            isFavorited={row.original.isFavorited}
          />
        </div>
      );
    },
  },
];