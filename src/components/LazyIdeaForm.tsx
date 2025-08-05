"use client";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const IdeaForm = dynamic(() => import("./IdeaForm"), {
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="text-center my-6">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for better performance on client-side hydration
});

export default function LazyIdeaForm() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading Hackathon AI...</p>
          </div>
        </div>
      }
    >
      <IdeaForm />
    </Suspense>
  );
}
