"use client";

import dynamic from "next/dynamic";

const CitiesGrid = dynamic(
  () => import("@/app/components/home/CitiesGrid"),
  { ssr: false, loading: () => <div style={{ minHeight: 300 }} /> }
);

export default function CitiesGridClient() {
  return <CitiesGrid />;
}