export const throwIfFailed = async (response: Response) => {
  if (response.ok) return;
  let message = "요청에 실패했습니다.";
  try {
    const data = await response.json();
    if (data.message) message = data.message;
  } catch {
  }
  throw new Error(message);
};

export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
