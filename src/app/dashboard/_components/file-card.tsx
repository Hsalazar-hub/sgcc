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
  } as Record<Doc<"files">["type"], ReactNode>;

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
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
  <div className="flex items-center gap-2 text-xs text-gray-700 w-40">
    <Avatar className="w-6 h-6">
      <AvatarImage src={userProfile?.image} />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    {userProfile?.name}
  </div>
  <div className="text-xs text-gray-700">
    Monto {file.monto}$
  </div>
  <div className="text-xs text-gray-700">
    Subida el {formatRelative(new Date(file._creationTime), new Date())}
  </div>
  <div className="text-xs text-gray-700">
 
   {file.expdate ? (
        <div>Expira {formatRelative(new Date(file.expdate), new Date())}</div>
      ) : (
        <div>Sin fecha de expiración</div>
      )}
  </div>
  <div className="text-xs text-gray-700">
    Tipo de póliza: {file.ptype}
  </div>
</CardFooter>
    </Card>
  );
}
