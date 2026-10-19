export class InvalidAgentResponseError extends Error {
  constructor(label: string, status: number) {
    super(`Apps Script returned an unexpected response for ${label} (HTTP ${status}). Please try again.`);
    this.name = "InvalidAgentResponseError";
  }
}

export async function parseAgentResponse(res: Response, label: string) {
  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new InvalidAgentResponseError(label, res.status);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

// Retry only side-effect-free actions, never customer updates or email sends.
export async function retryReadOnlyAppsScriptAction<T>(
  request: () => Promise<T>,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof InvalidAgentResponseError) && !(error instanceof TypeError)) throw error;
      if (attempt === 2) throw error;
      await wait(500 * (attempt + 1));
    }
  }
  throw new Error("Could not retrieve the Apps Script response.");
}
