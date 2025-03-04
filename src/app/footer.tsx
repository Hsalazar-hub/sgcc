import Link from "next/link";

export function Footer() {
  return (
    <div className="h-40 bg-gray-100 mt-12 flex items-center">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
        <div className="mb-4 sm:mb-0">SGCS</div>
        <div>Todos los derechos reservados.</div>
      </div>
    </div>
  );
}