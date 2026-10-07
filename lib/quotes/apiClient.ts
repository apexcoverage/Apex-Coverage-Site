export async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error("The server returned an empty response. Please refresh and try again.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an unreadable response. Please refresh and try again.");
  }
}
