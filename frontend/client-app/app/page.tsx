import { Suspense } from "react";
import DisplayController from "@/components/DisplayController";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="h-screen w-screen bg-black" />
      }
    >
      <DisplayController />
    </Suspense>
  );
}