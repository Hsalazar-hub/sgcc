import { Doc } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileIcon,
  MoreVertical,
  StarHalf,
  StarIcon,
  TrashIcon,
  UndoIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Protect } from "@clerk/nextjs";

export function PolizaCardActions({
  poliza,
  isFavorited,
}: {
  poliza: Doc<"polizas"> & { url: string | null };
  isFavorited: boolean;
}) {
  const deletepoliza = useMutation(api.polizas.deletepoliza);
  const restorepoliza = useMutation(api.polizas.restorepoliza);
  const toggleFavorite = useMutation(api.polizas.toggleFavorite);
  const { toast } = useToast();
  const me = useQuery(api.corredores.getMe);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta opción marcará la póliza y la colocará en la lista de borrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deletepoliza({
                  polizaId: poliza._id,
                });
                toast({
                  variant: "default",
                  title: "Póliza marcada para borrar",
                  description: "Su póliza ha sido marcada para borrar",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              if (!poliza.url) return;
              window.open(poliza.url, "_blank");
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            <FileIcon className="w-4 h-4" /> <span className="hidden sm:inline">Visualizar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              toggleFavorite({
                polizaId: poliza._id,
              });
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            {isFavorited ? (
              <div className="flex gap-1 items-center">
                <StarIcon className="w-4 h-4" /> <span className="hidden sm:inline">No importante</span>
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <StarHalf className="w-4 h-4" /> <span className="hidden sm:inline">Importante</span>
              </div>
            )}
          </DropdownMenuItem>

          <Protect
            condition={(check) => {
              return (
                check({
                  role: "org:admin",
                }) || poliza.corredorId === me?._id
              );
            }}
            fallback={<></>}
          >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (poliza.shouldDelete) {
                  restorepoliza({
                    polizaId: poliza._id,
                  });
                } else {
                  setIsConfirmOpen(true);
                }
              }}
              className="flex gap-1 items-center cursor-pointer"
            >
              {poliza.shouldDelete ? (
                <div className="flex gap-1 text-green-600 items-center cursor-pointer">
                  <UndoIcon className="w-4 h-4" /> <span className="hidden sm:inline">Restaurar</span>
                </div>
              ) : (
                <div className="flex gap-1 text-red-600 items-center cursor-pointer">
                  <TrashIcon className="w-4 h-4" /> <span className="hidden sm:inline">Borrar</span>
                </div>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}