import { Suspense } from "react";
import DisplayController from "@/components/DisplayController";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DisplayController />
    </Suspense>
  );
}