import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-100 mt-12 py-6">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
        <div className="mb-4 sm:mb-0">
          <Link href="/">
            <div className="text-lg font-bold text-gray-800">SGCS</div>
          </Link>
        </div>
        <div className="text-gray-600">Todos los derechos reservados.</div>
      </div>
    </footer>
  );
}