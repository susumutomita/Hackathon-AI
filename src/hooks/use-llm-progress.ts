"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Phase =
  | "idle"
  | "queued"
  | "preparing_prompt"
  | "calling_llm"
  | "formatting"
  | "fallback"
  | "done"
  | "error";

export function useLlmProgress() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPhase("idle");
    setPartial("");
    setError(null);
  }, []);

  const start = useCallback(
    async (body: any) => {
      reset();
      const controller = new AbortController();
      controllerRef.current = controller;
      setPhase("queued");

      // Use fetch + ReadableStream to parse SSE
      const resp = await fetch("/api/improve-idea-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to open streaming connection");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const pump = async (): Promise<void> => {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        // Parse SSE frames
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = raw.split("\n");
          let event: string | null = null;
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr += line.slice(5).trim();
            }
          }
          if (!event) continue;
          try {
            const data = dataStr ? JSON.parse(dataStr) : {};
            switch (event) {
              case "status":
                if (data?.phase) setPhase(data.phase);
                break;
              case "delta":
                if (typeof data?.token === "string") {
                  setPartial((p) => p + data.token);
                }
                break;
              case "done":
                if (typeof data?.text === "string") setPartial(data.text);
                setPhase("done");
                break;
              case "error":
                setError(data?.message || "Unknown error");
                setPhase("error");
                break;
            }
          } catch {
            // ignore malformed chunks
          }
        }
        await pump();
      };

      await pump();
    },
    [reset],
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    setPhase("idle");
  }, []);

  return useMemo(
    () => ({ phase, partial, error, start, reset, abort }),
    [phase, partial, error, start, reset, abort],
  );
}
