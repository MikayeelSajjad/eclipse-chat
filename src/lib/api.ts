export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      let error =
        typeof body.error === "string" ? body.error : "Request failed";
      if (error === "Request failed" && res.status === 404) {
        error =
          "Server API not found. Deploy the full app on Vercel with Turso (see DEPLOY.md).";
      }
      if (res.status === 503 && typeof body.error === "string") {
        error = body.error;
      }
      return { ok: false, error };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
