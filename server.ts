import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Proxy endpoint to test API connection and fetch models without browser CORS issues
  app.post('/api/fetch-models', async (req, res) => {
    try {
      const { url, apiKey } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: 'API 地址不能为空' });
      }

      let baseUrl = url.trim().replace(/\/+$/, '');
      let targetUrl = baseUrl;
      if (!targetUrl.endsWith('/models')) {
        targetUrl = `${targetUrl}/models`;
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'KeyVault-Client/1.0',
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const errorText = await response.text();
        let message = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorText);
          message = parsed?.error?.message || parsed?.message || message;
        } catch {
          if (errorText && errorText.length < 200) message = errorText;
        }
        return res.status(response.status).json({
          success: false,
          error: message,
          status: response.status
        });
      }

      const data: any = await response.json();
      
      // Normalize models list format:
      // 1. OpenAI format: { object: 'list', data: [{ id: 'gpt-4o' }] }
      // 2. Ollama format: { models: [{ name: 'llama3:latest' }] }
      // 3. Array of strings or objects: ['model1'] or [{ id: 'model1' }]
      let modelList: string[] = [];

      if (Array.isArray(data?.data)) {
        modelList = data.data.map((m: any) => typeof m === 'string' ? m : m.id || m.name).filter(Boolean);
      } else if (Array.isArray(data?.models)) {
        modelList = data.models.map((m: any) => typeof m === 'string' ? m : m.name || m.id).filter(Boolean);
      } else if (Array.isArray(data)) {
        modelList = data.map((m: any) => typeof m === 'string' ? m : m.id || m.name).filter(Boolean);
      }

      return res.json({
        success: true,
        models: modelList,
        rawCount: modelList.length,
        data: data
      });
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      return res.status(500).json({
        success: false,
        error: isTimeout ? '请求超时 (12秒)，请检查站点地址是否可用' : (err.message || '请求站点模型列表失败')
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
