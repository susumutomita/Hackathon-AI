import React from "react";
import IdeaForm from "@/components/IdeaForm";
import FinalistList from "@/components/FinalistList";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hackathon AI Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Submit Your Idea</h2>
        <IdeaForm />
      </div>
    </div>
  );
}
