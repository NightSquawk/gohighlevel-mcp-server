import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { GhlConfig, GhlMethod } from "../types.js";

export class GoHighLevelClient {
  private readonly http: AxiosInstance;
  readonly defaultLocationId: string;

  constructor(config: GhlConfig) {
    this.defaultLocationId = config.locationId;
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
        Version: config.apiVersion
      }
    });
  }

  async request<T>(
    method: GhlMethod,
    path: string,
    options: Pick<AxiosRequestConfig, "data" | "params"> = {}
  ): Promise<T> {
    const response = await this.http.request<T>({
      method,
      url: normalizePath(path),
      ...options
    });

    return response.data;
  }

  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>("POST", path, { data: body });
  }

  put<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>("PUT", path, { data: body });
  }

  del<T>(path: string, params?: Record<string, unknown>, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>("DELETE", path, { params, data: body });
  }
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
