"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, `Required`),
  monto: z.number(),
  expdate: z.date(),
  ptype: z.string(),
  cname: z.string(),
  email: z.string().email(),
  cnumber: z.string(),
});

export function UploadButton() {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
      monto: 0,
      cname: "",
      email: "",
      cnumber: "",
      expdate: new Date(),
      ptype: undefined,
    },
  });

  const fileRef = form.register("file");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) return;

    const data: any = values;
    const postUrl = await generateUploadUrl();

    const fileType = values.file[0].type;

    data.expdate = new Date(data.expdate).getTime();

    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": fileType },
      body: data.file[0],
    });
    const { storageId } = await result.json();

    const types = {
      "image/png": "image",
      "image/jpeg": "image",
      "application/pdf": "pdf",
      "text/csv": "csv",
    } as Record<string, Doc<"files">["type"]>;

    try {
      const newfile = {
        name: data.title,
        fileId: storageId,
        expdate: data.expdate,
        orgId,
        cname: data.cname,
        email: data.email,
        cnumber: data.cnumber,
        monto: +data.monto,
        type: types[fileType],
        ptype: data.ptype,
      };

      console.log("fileType: ", fileType);
      console.log("types: ", types);
      console.log("data: ", data);
      console.log("data: ", newfile);

      await createFile(newfile);

      form.reset();

      setIsFileDialogOpen(false);

      toast({
        variant: "success",
        title: "Póliza añadida con éxito",
        description: "Póliza añadida con éxito",
      });
    } catch (err) {
      console.log("err: ", err);

      toast({
        variant: "destructive",
        title: "Hubo un problema",
        description: "Su póliza no pudo ser añadida, intente mas tarde",
      });
    }
  }

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const createFile = useMutation(api.files.createFile);

  return (
    <Dialog
      open={isFileDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFileDialogOpen(isOpen);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Añadir Póliza</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full mx-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="mb-8">Añada su póliza</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Tomador:</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero del tomador</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo del tomador</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ptype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de póliza</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="type-select">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HCM">HCM</SelectItem>
                        <SelectItem value="Vehiculo">Vehiculo</SelectItem>
                        <SelectItem value="RCV de vehículos">
                          RCV de vehículos
                        </SelectItem>
                        <SelectItem value="RCV de embarcacion">
                          RCV de embarcacion
                        </SelectItem>
                        <SelectItem value="RCV de aviación">
                          RCV de aviación
                        </SelectItem>
                        <SelectItem value="Incendios">Incendios</SelectItem>
                        <SelectItem value="Combinado Residencial">
                          Combinado Residencial
                        </SelectItem>
                        <SelectItem value="Accidentes personales">
                          Accidentes personales
                        </SelectItem>
                        <SelectItem value="Poliza de vida">
                          Poliza de vida
                        </SelectItem>
                        <SelectItem value="Poliza Empresarial">
                          Poliza Empresarial
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input
                        id="monto"
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de expiración</FormLabel>
                    <FormControl>
                      <Input
                        id="expdate"
                        type="date"
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Archivo</FormLabel>
                    <FormControl>
                      <Input type="file" {...fileRef} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex gap-1"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Añadir
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}