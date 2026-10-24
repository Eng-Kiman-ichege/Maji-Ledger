/**
 * Health check API
 */
import { api } from "./client";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  utc: string;
}

export const healthApi = {
  get: () => api.get<HealthResponse>("/api/health"),
};
