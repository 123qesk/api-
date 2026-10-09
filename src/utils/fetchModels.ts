export interface FetchModelsResult {
  success: boolean;
  models: string[];
  error?: string;
  source?: 'proxy' | 'direct';
}

export async function pullModelsFromProvider(url: string, apiKey: string): Promise<FetchModelsResult> {
  const trimmedUrl = url.trim().replace(/\/+$/, '');
  const trimmedKey = apiKey.trim();

  if (!trimmedUrl) {
    return {
      success: false,
      models: [],
      error: '请先输入 API 端点地址 (Base URL)',
    };
  }

  // 1. Try server proxy endpoint first (avoids browser CORS issues)
  try {
    const res = await fetch('/api/fetch-models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: trimmedUrl,
        apiKey: trimmedKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        return {
          success: true,
          models: data.models,
          source: 'proxy',
        };
      }
      if (data.error) {
        return {
          success: false,
          models: [],
          error: data.error,
        };
      }
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.error) {
        return {
          success: false,
          models: [],
          error: errJson.error,
        };
      }
    }
  } catch (err) {
    console.warn('Proxy model fetch failed, falling back to direct browser fetch...', err);
  }

  // 2. Direct browser fetch fallback (especially for localhost endpoints like Ollama)
  try {
    let targetUrl = trimmedUrl;
    if (!targetUrl.endsWith('/models')) {
      targetUrl = `${targetUrl}/models`;
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (trimmedKey) {
      headers['Authorization'] = `Bearer ${trimmedKey}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const directRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!directRes.ok) {
      const errText = await directRes.text();
      let errorMsg = `HTTP ${directRes.status}: ${directRes.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed?.error?.message || parsed?.message || errorMsg;
      } catch {}
      return {
        success: false,
        models: [],
        error: errorMsg,
      };
    }

    const data = await directRes.json();
    let modelList: string[] = [];

    if (Array.isArray(data?.data)) {
      modelList = data.data.map((m: any) => typeof m === 'string' ? m : m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data?.models)) {
      modelList = data.models.map((m: any) => typeof m === 'string' ? m : m.name || m.id).filter(Boolean);
    } else if (Array.isArray(data)) {
      modelList = data.map((m: any) => typeof m === 'string' ? m : m.id || m.name).filter(Boolean);
    }

    return {
      success: true,
      models: modelList,
      source: 'direct',
    };
  } catch (directErr: any) {
    return {
      success: false,
      models: [],
      error: directErr.message || '连接失败，请确认端点与密钥是否有效，且网络可直连。',
    };
  }
}
