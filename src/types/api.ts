// Spring Boot 공통 응답 형식에 맞춰 수정하세요.
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  status: number;
  code?: string;
  message: string;
}
