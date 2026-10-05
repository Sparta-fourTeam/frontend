// 예시 서비스: 도메인별로 파일을 나눠서 API 호출 함수를 모아둡니다. (userService.ts, gameService.ts ...)
import { api } from "@/lib/api";
import { API_PATHS } from "@/constants/apiPaths";

export interface HealthStatus {
  status: string;
}

export const healthService = {
  check: () => api.get<HealthStatus>(API_PATHS.health),
};
