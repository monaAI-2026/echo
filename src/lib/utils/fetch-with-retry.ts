/**
 * 带超时和重试的 fetch 工具函数
 */

interface FetchWithRetryOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * 带超时和重试的 fetch
 * @param url - 请求 URL
 * @param options - fetch 选项 + 超时和重试配置
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeout = 30000, // 默认 30 秒超时
    retries = 2, // 默认重试 2 次
    retryDelay = 1000, // 默认重试延迟 1 秒
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 如果不是第一次尝试，等待一段时间
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries}...`);
        await sleep(retryDelay * attempt); // 递增延迟
      }

      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // 如果响应成功，直接返回
      if (response.ok) {
        return response;
      }

      // 如果是 4xx 错误（客户端错误），不重试
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // 5xx 错误（服务器错误）会重试
      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 如果是最后一次尝试，抛出错误
      if (attempt === retries) {
        console.error(`All ${retries + 1} attempts failed:`, lastError.message);
        throw lastError;
      }

      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  // 理论上不会到这里，但为了类型安全
  throw lastError || new Error("Unknown error");
}
