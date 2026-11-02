/**
 * 「问问 Wingwen」对话面板的客户端逻辑。
 *
 * 会话只存在内存里：不写 localStorage / sessionStorage / cookie，刷新即清空。
 * 关闭面板再打开会保留当前会话，这是同一个页面内的行为。
 */

const MAX_QUESTION = 300;
const MAX_HISTORY_TURNS = 6;
const MAX_MESSAGES = 30;

interface SourceRef {
  key: string;
  title: string;
  url: string;
}

type ChatMessage =
  | { role: 'user' | 'assistant'; text: string; sources?: SourceRef[] }
  | { role: 'system'; text: string; retry?: string };

interface ChatResponse {
  answer?: string;
  sources?: SourceRef[];
  error?: string;
}

const errorCopy: Record<string, string> = {
  not_configured: '助手还没接通，先看看项目页？',
  budget_unavailable: '助手暂时不可用，先看看项目页。',
  daily_budget_exhausted: '今天问得有点多了，明天再来。',
  rate_limited: '问得有点快，等一分钟再来。',
  upstream_timeout: '这次没答上来，再试一次。',
  upstream_failed: '这次没答上来，再试一次。',
  network: '连不上，检查网络后重试。',
  server_error: '这次没答上来，再试一次。',
};

function isSourceList(value: unknown): value is SourceRef[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as SourceRef).key === 'string' &&
        typeof (item as SourceRef).title === 'string' &&
        typeof (item as SourceRef).url === 'string',
    )
  );
}

export function mountAssistantChat(): void {
  const dialog = document.getElementById('ask-chat');
  if (!(dialog instanceof HTMLDialogElement)) return;

  const log = dialog.querySelector<HTMLElement>('[data-chat-log]');
  const form = dialog.querySelector<HTMLFormElement>('[data-chat-form]');
  const input = dialog.querySelector<HTMLInputElement>('[data-chat-input]');
  const sendButton = dialog.querySelector<HTMLButtonElement>('[data-chat-send]');
  const countLabel = dialog.querySelector<HTMLElement>('[data-chat-count]');
  const quickGroup = dialog.querySelector<HTMLElement>('[data-chat-quick]');

  // 开场白从服务端渲染的节点里取一次，之后由前端接管渲染。
  const greeting = log?.textContent?.trim() ?? '';

  const messages: ChatMessage[] = [];
  let pending = false;
  let lastOpener: HTMLElement | null = null;

  function historyPayload(): { role: 'user' | 'assistant'; content: string }[] {
    const turns = messages
      .filter(
        (message): message is Extract<ChatMessage, { role: 'user' | 'assistant' }> =>
          message.role === 'user' || message.role === 'assistant',
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((message) => ({ role: message.role, content: message.text }));

    // 强制以用户发言开头，首条是助手回答时丢掉。
    while (turns.length > 0 && turns[0]?.role !== 'user') turns.shift();

    return turns;
  }

  function buildBubble(message: ChatMessage): HTMLElement {
    const bubble = document.createElement('div');
    bubble.className = `chat__bubble chat__bubble--${message.role}`;

    const text = document.createElement('p');
    text.className = 'chat__bubble-text';
    text.textContent = message.text;
    bubble.append(text);

    if (message.role === 'system' && message.retry) {
      const question = message.retry;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'chat__retry';
      retry.textContent = '重试';
      retry.addEventListener('click', () => {
        const index = messages.indexOf(message);
        if (index >= 0) messages.splice(index, 1);
        render();
        void send(question);
      });
      bubble.append(retry);
    }

    if (message.role === 'assistant' && message.sources && message.sources.length > 0) {
      const sources = document.createElement('p');
      sources.className = 'chat__sources';
      sources.append(document.createTextNode('参考：'));

      message.sources.forEach((source, index) => {
        if (index > 0) sources.append(document.createTextNode(' · '));
        const link = document.createElement('a');
        link.href = source.url;
        link.textContent = source.title;
        sources.append(link);
      });

      bubble.append(sources);
    }

    return bubble;
  }

  function render(): void {
    if (!log) return;

    const nodes: HTMLElement[] = [];
    if (greeting) {
      const intro = document.createElement('p');
      intro.className = 'chat__bubble chat__bubble--assistant';
      intro.textContent = greeting;
      nodes.push(intro);
    }
    nodes.push(...messages.map(buildBubble));

    log.replaceChildren(...nodes);
    log.scrollTop = log.scrollHeight;

    const started = messages.length > 0;
    if (quickGroup) quickGroup.hidden = started;
  }

  function setBusy(busy: boolean): void {
    pending = busy;
    if (input) input.disabled = busy;
    if (sendButton) {
      sendButton.disabled = busy;
      sendButton.textContent = busy ? '思考中…' : '发送';
    }
  }

  function updateCount(): void {
    if (!input || !countLabel) return;
    const used = [...input.value].length;
    countLabel.textContent = `还剩 ${Math.max(0, MAX_QUESTION - used)} 字`;
  }

  async function send(question: string): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    if ([...trimmed].length > MAX_QUESTION) {
      messages.push({ role: 'system', text: `问题最多 ${MAX_QUESTION} 字，删掉一些再发。` });
      while (messages.length > MAX_MESSAGES) messages.shift();
      render();
      return;
    }

    const history = historyPayload();
    messages.push({ role: 'user', text: trimmed });
    while (messages.length > MAX_MESSAGES) messages.shift();
    render();
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmed, history }),
      });

      let payload: ChatResponse = {};
      try {
        payload = (await response.json()) as ChatResponse;
      } catch {
        payload = {};
      }

      if (!response.ok || typeof payload.answer !== 'string') {
        const copy = errorCopy[payload.error ?? ''] ?? errorCopy.server_error ?? '';
        messages.push({ role: 'system', text: copy, retry: trimmed });
      } else {
        messages.push({
          role: 'assistant',
          text: payload.answer,
          sources: isSourceList(payload.sources) ? payload.sources : [],
        });
      }
    } catch {
      messages.push({ role: 'system', text: errorCopy.network ?? '', retry: trimmed });
    } finally {
      while (messages.length > MAX_MESSAGES) messages.shift();
      render();
      setBusy(false);
      input?.focus();
    }
  }

  document.querySelectorAll<HTMLElement>('[data-chat-open]').forEach((node) => {
    node.addEventListener('click', () => {
      if (dialog.open) return;
      lastOpener = node;
      dialog.showModal();
      document.documentElement.classList.add('chat-open');
      input?.focus();
    });
  });

  dialog.querySelector('[data-chat-close]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('chat-open');
    lastOpener?.focus();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input) return;
    const question = input.value;
    input.value = '';
    updateCount();
    void send(question);
  });

  input?.addEventListener('input', updateCount);

  quickGroup?.querySelectorAll<HTMLButtonElement>('[data-quick]').forEach((button) => {
    button.addEventListener('click', () => {
      void send(button.dataset.quick ?? '');
    });
  });

  render();
  updateCount();
}
