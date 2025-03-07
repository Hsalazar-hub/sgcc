"use client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { PolizaCard } from "./poliza-card";
import Image from "next/image";
import { GridIcon, Loader2, RowsIcon } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { DataTable } from "./file-table";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="300"
        height="300"
        src="/empty.svg"
      />
      <div className="text-2xl">No posee ninguna póliza en esta seccion.</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({
  title,
  favoritesOnly,
  deletedOnly,
}: {
  title: string;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Doc<"polizas">["type"] | "all">("all");
  const [ptype, setpType] = useState<Doc<"polizas">["ptype"] | "all">("all");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  // const favorites = useQuery(
  //   api.polizas.getAllFavorites,
  //   orgId ? { orgId } : "skip"
  // );

  const polizas = useQuery(
    api.polizas.getpolizas,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          query,
          favorites: favoritesOnly,
          ptype: ptype === "all" ? undefined : ptype,
          deletedOnly,
        }
      : "skip"
  );
  const isLoading = polizas === undefined;

  // const modifiedpolizas =
  //   polizas?.map((poliza) => ({
  //     ...poliza,
  //     isFavorited: (favorites ?? []).some(
  //       (favorite) => favorite.polizaId === poliza._id
  //     ),
  //   })) ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{title}</h1>

        <SearchBar query={query} setQuery={setQuery} />

        <UploadButton />
      </div>

      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center">
          <TabsList className="mb-2">
            <TabsTrigger value="grid" className="flex gap-2 items-center">
              <GridIcon />
              <span className="hidden sm:inline">Grillas</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex gap-2 items-center">
              <RowsIcon />
              <span className="hidden sm:inline">Tablas</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 items-center">
            <Label htmlFor="type-select" className="hidden sm:inline">
              Filtrado por tipo de póliza
            </Label>
            <Select
              value={ptype}
              onValueChange={(newType) => {
                setpType(newType as any);
              }}
            >
              <SelectTrigger id="type-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="HCM">HCM</SelectItem>
                <SelectItem value="Vehiculo">Vehiculo</SelectItem>
                <SelectItem value="RCV de vehículos">RCV de vehículos</SelectItem>
                <SelectItem value="RCV de embarcacion">RCV de embarcacion</SelectItem>
                <SelectItem value="RCV de aviación">RCV de aviación</SelectItem>
                <SelectItem value="Incendios">Incendios</SelectItem>
                <SelectItem value="Combinado Residencial">Combinado Residencial</SelectItem>
                <SelectItem value="Accidentes personales">Accidentes personales</SelectItem>
                <SelectItem value="Poliza de vida">Poliza de vida</SelectItem>
                <SelectItem value="Poliza Empresarial">Poliza Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-8 w-full items-center mt-24">
            <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
            <div className="text-2xl">Cargando sus pólizas...</div>
          </div>
        )}

        <TabsContent value="grid">
          {/* <div className="grid grid-cols-3 gap-4">
            {modifiedpolizas?.map((poliza) => {
              return <PolizaCard key={poliza._id} poliza={poliza} />;
            })}
          </div> */}
        </TabsContent>
        <TabsContent value="table">
          {/* <DataTable columns={columns} data={modifiedpolizas} /> */}
        </TabsContent>
      </Tabs>

      {polizas?.length === 0 && <Placeholder />}
    </div>
  );
}