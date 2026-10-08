export const throwIfFailed = async (response: Response) => {
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  throw new Error(data?.message ?? "요청에 실패했습니다.");
};

export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
