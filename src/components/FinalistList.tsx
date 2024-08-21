"use client";
import React, { useEffect, useState } from "react";
import { fetchFinalists } from "@/lib/fetchFinalists";
import { Project } from "@/types";

export default function FinalistList() {
  const [finalists, setFinalists] = useState<Project[]>([]);

  useEffect(() => {
    const loadFinalists = async () => {
      const data = await fetchFinalists();
      setFinalists(data);
    };
    loadFinalists();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Finalist Projects</h2>
      <ul>
        {finalists.map((project, index) => (
          <li key={index} className="mb-4 border-b pb-4">
            <a href={project.link} className="text-blue-600 underline">
              {project.title}
            </a>
            <p>{project.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
