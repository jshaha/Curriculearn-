import { Suspense } from "react";

import { HomeClient } from "@/components/HomeClient";

const LoadingFallback = (): JSX.Element => (
  <main className="h-screen w-screen bg-bg" aria-hidden="true" />
);

export default function HomePage(): JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeClient />
    </Suspense>
  );
}
