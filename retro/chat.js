const form = document.querySelector('#chat-form');
const field = document.querySelector('#question');
const button = form.querySelector('button');
const conversation = document.querySelector('#conversation');
const status = document.querySelector('#chat-status');
const turns = [];
const historyKey = 'portfolio-chat-history';
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

function resizeField() {
  field.style.height = 'auto';
  const borders = field.offsetHeight - field.clientHeight;
  field.style.height = `${field.scrollHeight + borders}px`;
}

field.addEventListener('input', resizeField);
window.addEventListener('resize', resizeField);
field.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (!event.repeat && !button.disabled && field.value.trim()) form.requestSubmit();
});

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

function bigrams(phrase) {
  const padded = `^${phrase}$`;
  return new Set([...padded].slice(0, -1).map((_, index) => padded.slice(index, index + 2)));
}

const greetingClasses = [
  {
    reply: 'Hey! What would you like to know?',
    examples: ['hi', 'hey', 'hello', 'hi there', 'hey there', 'hello there', 'hiya',
      'good morning', 'good afternoon', 'good evening']
  },
  {
    reply: 'I’m doing well, thanks for asking! What’s on your mind?',
    examples: ['how are you', 'how are you doing', 'how are you today', 'how have you been',
      'how you doing', 'how is it going', 'how is everything going', 'how is your day going',
      'how is your day', 'how is life', 'how are things', 'how are things going',
      'how are you doing tonight', 'how have things been with you', 'how are things with you',
      'what is up', 'what is good', 'you doing okay']
  }
].map(({ reply, examples }) => ({
  reply,
  vocabulary: new Set(examples.flatMap(phrase => phrase.split(' '))),
  samples: examples.map(phrase => ({ words: phrase.split(' ').length, features: bigrams(phrase) }))
}));

function greetingReply(question) {
  let phrase = question.toLowerCase().replace(/[‘’]/g, "'")
    .replace(/\b(how|what)'?s\b/g, '$1 is')
    .replace(/\br\b/g, 'are').replace(/\bu\b/g, 'you')
    .replace(/\bya\b/g, 'you').replace(/\bdoin\b/g, 'doing')
    .replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  phrase = phrase.replace(/^(?:hi|hey|hello)(?:[,!.]\s*|\s+)(?=how |what |you )/, '');
  const words = phrase.split(' ');
  const features = bigrams(phrase);
  let bestScore = 0.79;
  let reply;
  for (const category of greetingClasses) {
    if (!words.every(word => category.vocabulary.has(word))) continue;
    for (const sample of category.samples) {
      if (words.length !== sample.words) continue;
      let overlap = 0;
      for (const feature of features) {
        if (sample.features.has(feature)) overlap++;
      }
      const score = 2 * overlap / (features.size + sample.features.size);
      if (score > bestScore) {
        bestScore = score;
        reply = category.reply;
      }
    }
  }
  return reply;
}

function rememberTurn(user, text, local = false) {
  const assistant = { role: 'assistant', content: text.trim() };
  turns.push({ ...user, local }, { ...assistant, local });
  try {
    sessionStorage.setItem(historyKey, JSON.stringify(turns));
  } catch {
    // Keep the current conversation visible if storage is unavailable.
  }
}

function restoreHistory(reloaded = false) {
  try {
    if (reloaded) {
      sessionStorage.removeItem(historyKey);
      return;
    }
    const saved = JSON.parse(sessionStorage.getItem(historyKey) ?? '[]');
    if (JSON.stringify(saved) === JSON.stringify(turns)) return;
    while (conversation.children.length > 1) conversation.lastElementChild.remove();
    turns.length = 0;
    for (const message of saved) {
      addMessage(message.role === 'user' ? 'You' : 'Assistant', message.content);
      turns.push(message);
    }
    showLatestMessage();
  } catch {
    // Chat still works when the browser blocks storage.
  }
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

  field.value = '';
  resizeField();
  const user = { role: 'user', content: question };
  const sent = addMessage('You', question);
  showLatestMessage();
  const greeting = greetingReply(question);
  if (greeting) {
    addMessage('Assistant', greeting);
    rememberTurn(user, greeting, true);
    status.textContent = '';
    showLatestMessage();
    return;
  }

  button.disabled = true;
  status.textContent = 'Waiting for a reply…';
  let reply;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [
        ...turns.filter(message => !message.local).slice(-4)
          .map(({ role, content }) => ({ role, content: content.slice(0, 1200) })),
        user
      ] }),
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
    rememberTurn(user, text);
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
    resizeField();
    conversation.setAttribute('aria-live', 'polite');
    button.disabled = false;
  }
});

form.hidden = false;
restoreHistory(performance.getEntriesByType?.('navigation')[0]?.type === 'reload');
window.addEventListener('pageshow', event => {
  if (event.persisted) restoreHistory();
});
