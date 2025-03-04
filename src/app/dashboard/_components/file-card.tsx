import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelative, setDefaultOptions } from "date-fns";
import { es } from 'date-fns/locale';
import { Doc } from "../../../../convex/_generated/dataModel";
import { FileTextIcon, GanttChartIcon, ImageIcon } from "lucide-react";
import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
import { FileCardActions } from "./file-actions";
setDefaultOptions({ locale: es });

const StatusChip = ({ status }: any) => {
  const statusMap: any = {
    ongoing: { color: "bg-green-500", label: "En Curso" },
    nearexpired: { color: "bg-orange-500", label: "Por Expirar" },
    expired: { color: "bg-red-500", label: "Expirado" },
  };

  // Si el estado no existe, usa "ongoing" por defecto
  const statusData = statusMap[status] || statusMap.ongoing;

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${statusData.color} sm:hidden`} />
      <span className={`hidden sm:inline px-3 py-1 text-white text-sm font-semibold rounded-full ${statusData.color}`}>
        {statusData.label}
      </span>
    </div>
  );
};

export function FileCard({
  file,
}: {
  file: Doc<"files"> & { isFavorited: boolean; url: string | null };
}) {
  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId,
  });

  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<NonNullable<Doc<"files">["type"]>, ReactNode>;

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
          <span className="truncate hidden sm:inline">{file.name}</span>
        </CardTitle>
        <div className="absolute top-2 right-2 hidden sm:flex gap-2">
          <StatusChip status={file.status} />
          <FileCardActions isFavorited={file.isFavorited} file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center">
        {file.type === "image" && file.url && (
          <Image alt={file.name} width="200" height="100" src={file.url} />
        )}

        {file.type === "csv" && <GanttChartIcon className="w-20 h-20" />}
        {file.type === "pdf" && <FileTextIcon className="w-20 h-20" />}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-start">
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-700 w-40">
          <Avatar className="w-6 h-6">
            <AvatarImage src={userProfile?.image} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="truncate">{userProfile?.name}</span>
        </div>
        <div className="hidden sm:block text-xs text-gray-700 truncate">
          Monto {file.monto}$
        </div>
        <div className="hidden sm:block text-xs text-gray-700 truncate">
          Subida el {formatRelative(new Date(file._creationTime), new Date())}
        </div>
        <div className="hidden sm:block text-xs text-gray-700 truncate">
          {file.expdate ? (
            <div>Expira {formatRelative(new Date(file.expdate), new Date())}</div>
          ) : (
            <div>Sin fecha de expiración</div>
          )}
        </div>
        <div className="hidden sm:block text-xs text-gray-700 truncate">
          Tipo de póliza: {file.ptype}
        </div>
        <div className="flex sm:hidden flex-col gap-2 mt-2 w-full">
          <span className="truncate text-xs text-gray-700">{file.name}</span>
          <div className="flex gap-2">
            <StatusChip status={file.status} />
            <FileCardActions isFavorited={file.isFavorited} file={file} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}