import React, { useState } from 'react';
import { ApiKeyItem } from '../types';
import { useToast } from './Toast';
import { Code2, Copy, Check, X, Terminal, Cpu } from 'lucide-react';

interface QuickCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApiKeyItem | null;
  isVaultLocked: boolean;
}

export const QuickCodeModal: React.FC<QuickCodeModalProps> = ({
  isOpen,
  onClose,
  item,
  isVaultLocked,
}) => {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'curl' | 'python' | 'node' | 'env'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const keyToDisplay = isVaultLocked && item.isEncrypted ? 'YOUR_API_KEY_LOCKED' : item.apiKey;
  const sampleModel = item.models && item.models.length > 0 ? item.models[0] : 'gpt-4o';

  const snippets = {
    curl: `curl "${item.baseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${keyToDisplay}" \\
  -d '{
    "model": "${sampleModel}",
    "messages": [{"role": "user", "content": "Hello World!"}],
    "temperature": 0.7
  }'`,

    python: `from openai import OpenAI

client = OpenAI(
    base_url="${item.baseUrl}",
    api_key="${keyToDisplay}",
)

response = client.chat.completions.create(
    model="${sampleModel}",
    messages=[{"role": "user", "content": "Hello World!"}],
)
print(response.choices[0].message.content)`,

    node: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${item.baseUrl}",
  apiKey: "${keyToDisplay}",
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "${sampleModel}",
    messages: [{ role: "user", content: "Hello World!" }],
  });
  console.log(completion.choices[0].message.content);
}

main();`,

    env: `# ${item.name} 环境变量配置
OPENAI_BASE_URL="${item.baseUrl}"
OPENAI_API_KEY="${keyToDisplay}"
DEFAULT_MODEL="${sampleModel}"`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[tab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('集成代码已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                代码集成示例
              </h2>
              <p className="text-xs text-neutral-500">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setTab('curl')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors ${
              tab === 'curl'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            cURL 命令
          </button>
          <button
            onClick={() => setTab('python')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors ${
              tab === 'python'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Python (OpenAI)
          </button>
          <button
            onClick={() => setTab('node')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors ${
              tab === 'node'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Node.js / TS
          </button>
          <button
            onClick={() => setTab('env')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors ${
              tab === 'env'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-t border-x border-neutral-200 dark:border-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            .env 格式
          </button>
        </div>

        {/* Code View */}
        <div className="p-4 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto relative max-h-72">
          <pre className="p-2 leading-relaxed selection:bg-neutral-700">{snippets[tab]}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            支持标准 OpenAI 客户端库直接适配中转
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制代码' : '一键复制代码'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
