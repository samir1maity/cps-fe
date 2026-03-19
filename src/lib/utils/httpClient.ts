
/**
 * HTTP Client for making API requests
 */

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Generic HTTP client with automatic token refresh on 401
 */
export class HttpClient {
  private baseUrl: string;
  private refreshEndpoint: string;
  private isRefreshing = false;
  private refreshQueue: Array<(token: string | null) => void> = [];

  constructor(baseUrl: string, refreshEndpoint = '/api/v1/auth/refresh') {
    this.baseUrl = baseUrl;
    this.refreshEndpoint = refreshEndpoint;
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}${this.refreshEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      const newAccess = data?.data?.accessToken;
      const newRefresh = data?.data?.refreshToken;

      if (newAccess && newRefresh) {
        this.setTokens(newAccess, newRefresh);
        return newAccess;
      }

      this.clearTokens();
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const buildHeaders = (accessToken: string | null): Record<string, string> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return headers;
    };

    const doFetch = (accessToken: string | null) =>
      fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers: buildHeaders(token ?? accessToken),
        credentials: 'include',
      });

    let response = await doFetch(this.getAccessToken());

    if (response.status === 401) {
      // Queue subsequent 401s while a refresh is in flight
      if (this.isRefreshing) {
        const newToken = await new Promise<string | null>((resolve) => {
          this.refreshQueue.push(resolve);
        });
        if (newToken) {
          response = await doFetch(newToken);
        }
      } else {
        this.isRefreshing = true;
        const newToken = await this.tryRefreshToken();
        this.isRefreshing = false;
        this.refreshQueue.forEach((cb) => cb(newToken));
        this.refreshQueue = [];

        if (newToken) {
          response = await doFetch(newToken);
        } else {
          // Redirect to login if refresh failed
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
