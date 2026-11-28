import { CircleAlert } from "lucide-react";

// Mensagem de erro logo abaixo do campo (ligada a ele por aria-describedby).
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 flex items-center gap-1.5 text-sm text-danger">
      <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}