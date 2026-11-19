const form = document.querySelector('#chat-form');
const field = document.querySelector('#question');
const button = form.querySelector('button');
const conversation = document.querySelector('#conversation');
const status = document.querySelector('#chat-status');
const turns = [];
const viewport = window.visualViewport;

function keepComposerAboveKeyboard() {
  const height = viewport.scale === 1 ? `${viewport.height}px` : '';
  document.body.style.setProperty('--chat-viewport-height', height);
}

if (viewport) {
  keepComposerAboveKeyboard();
  viewport.addEventListener('resize', keepComposerAboveKeyboard);
}

function showLatestMessage() {
  conversation.scrollTop = conversation.scrollHeight;
}

function addMessage(label, text = '') {
  const message = document.createElement('div');
  const name = document.createElement('strong');
  const body = document.createElement('p');
  name.textContent = label;
  body.textContent = text;
  message.append(name, body);
  conversation.append(message);
  return body;
}

async function readReply(stream, onText) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error('The reply was interrupted. Please try again.');
      const lines = (pending + value).split('\n');
      pending = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        const text = JSON.parse(data).choices?.[0]?.delta?.content;
        if (typeof text === 'string' && text) onText(text);
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const question = field.value.trim();
  if (!question || button.disabled) return;

  button.disabled = true;
  field.value = '';
  status.textContent = 'Waiting for a reply…';
  const user = { role: 'user', content: question };
  const sent = addMessage('You', question);
  showLatestMessage();
  let reply;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...turns, user] }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      sent.parentElement.remove();
      const error = await response.json().catch(() => null);
      status.textContent = error?.message ?? 'Chat is unavailable right now. Please try again.';
      if (response.status !== 422 && !field.value) field.value = question;
      return;
    }
    let text = '';
    await readReply(response.body, delta => {
      const atBottom = conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight < 32;
      if (!reply) {
        conversation.setAttribute('aria-live', 'off');
        reply = addMessage('Assistant');
        status.textContent = 'Receiving a reply…';
      }
      text += delta;
      reply.textContent = text;
      if (atBottom) showLatestMessage();
    });
    if (!text.trim()) throw new Error('Empty reply');
    turns.push(user, { role: 'assistant', content: text.trim().slice(0, 1200) });
    if (turns.length > 4) turns.splice(0, 2);
    conversation.setAttribute('aria-live', 'polite');
    status.textContent = '';
    const announcement = document.createElement('span');
    announcement.className = 'chat-announcement';
    announcement.textContent = 'Assistant: ' + text;
    status.append(announcement);
  } catch {
    sent.parentElement.remove();
    reply?.parentElement.remove();
    status.textContent = 'The reply could not be completed. Please try again.';
    if (!field.value) field.value = question;
  } finally {
    conversation.setAttribute('aria-live', 'polite');
    button.disabled = false;
  }
});

form.hidden = false;
