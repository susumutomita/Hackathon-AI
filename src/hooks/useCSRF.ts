import { useState, useEffect, useCallback } from "react";

interface CSRFTokenResponse {
  csrfToken: string;
  message: string;
}

export const useCSRF = () => {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCSRFToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/csrf-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data: CSRFTokenResponse = await response.json();
      setCSRFToken(data.csrfToken);
    } catch (err: any) {
      setError(err.message || "Failed to fetch CSRF token");
      setCSRFToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  const getHeaders = useCallback(
    (additionalHeaders: Record<string, string> = {}) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...additionalHeaders,
      };

      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      return headers;
    },
    [csrfToken],
  );

  const makeSecureRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!csrfToken && options.method && options.method !== "GET") {
        throw new Error("CSRF token not available");
      }

      const headers = getHeaders(
        (options.headers as Record<string, string>) || {},
      );

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [csrfToken, getHeaders],
  );

  return {
    csrfToken,
    loading,
    error,
    refreshToken,
    getHeaders,
    makeSecureRequest,
  };
};
