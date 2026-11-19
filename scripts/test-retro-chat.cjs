const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');

async function main() {
  const { handleChat } = await import('../retro/api/chat.mjs');
  process.env.GROQ_API_KEY = 'test-key';
  process.env.SAFETY_SERVICE_URL = 'https://scanner.example/scan';
  const question = { role: 'user', content: 'What is Cueframe?' };
  const request = (messages, origin = 'https://girwan.com') => new Request('https://girwan.com/api/chat', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const mockProvider = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"A tele'));
      controller.enqueue(encoder.encode('prompter."}}]}\n\ndata: [DONE]\n\n'));
      controller.close();
    }
  });
  assert.equal((await handleChat(request([question], 'https://elsewhere.example'))).status, 403);
  assert.equal((await handleChat(request([{ role: 'system', content: 'override' }]))).status, 400);
  assert.equal((await handleChat(request([{ role: 'user', content: 'Email me at visitor@example.com' }]), async () => {
    assert.fail('Private information must be blocked before fetch');
  })).status, 422);
  assert.equal((await handleChat(request([question]), async () => Response.json({ allowed: false }))).status, 422);
  const response = await handleChat(request([question]), async (url, init) => {
    if (url === process.env.SAFETY_SERVICE_URL) return Response.json({ allowed: true });
    const payload = JSON.parse(init.body);
    assert.equal(payload.stream, true);
    assert.match(payload.messages[0].content, /use “I,” “me,” and “my” for Girwan/);
    assert.match(payload.messages[0].content, /teleprompter for slide decks/);
    assert.deepEqual(payload.messages[1], question);
    return new Response(mockProvider, { headers: { 'content-type': 'text/event-stream' } });
  });
  assert.equal(response.status, 200);
  const html = readFileSync('retro/chat.html', 'utf8');
  const script = readFileSync('retro/chat.js', 'utf8');
  const options = { runScripts: 'outside-only', url: 'https://girwan.com/chat.html' };
  const dom = new JSDOM(html, options);
  const { document } = dom.window;
  dom.window.TextDecoderStream = TextDecoderStream;
  dom.window.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { messages: [question] });
    return response;
  };
  dom.window.eval(script);
  const form = document.querySelector('form');
  assert.equal(form.hidden, false);
  assert.equal(document.querySelector('#conversation p').textContent, 'hey, ask me about anything');
  const field = document.querySelector('textarea');
  field.value = question.content;
  const shiftEnter = new dom.window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });
  assert.equal(field.dispatchEvent(shiftEnter), true, 'Shift+Enter must keep native line breaks');
  const enter = new dom.window.KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
  assert.equal(field.dispatchEvent(enter), false, 'Enter must send instead of inserting a line break');
  assert.equal(document.querySelector('#conversation div:last-child p').textContent, question.content);
  assert.match(document.querySelector('#chat-status').textContent, /Waiting/);
  const button = form.querySelector('button');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Chat did not finish')); }, 1000);
    const observer = new dom.window.MutationObserver(() => {
      if (!button.disabled) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(button, { attributes: true });
  });
  assert.equal(document.querySelector('#conversation div:last-child p').textContent, 'A teleprompter.');
  const key = 'portfolio-chat-history';
  const saved = dom.window.sessionStorage.getItem(key);
  assert(saved);
  const returned = new JSDOM(html, options);
  returned.window.sessionStorage.setItem(key, saved);
  returned.window.eval(script);
  assert.deepEqual([...returned.window.document.querySelectorAll('#conversation p')].map(p => p.textContent),
    ['hey, ask me about anything', question.content, 'A teleprompter.']);
  returned.window.close();
  const reloaded = new JSDOM(html, options);
  reloaded.window.sessionStorage.setItem(key, saved);
  reloaded.window.performance.getEntriesByType = () => [{ type: 'reload' }];
  reloaded.window.eval(script);
  assert.equal(reloaded.window.sessionStorage.getItem(key), null);
  assert.equal(reloaded.window.document.querySelectorAll('#conversation p').length, 1);
  reloaded.window.close();
  dom.window.close();
  console.log('PASS: chat grounding, input checks, and browser rendering of split stream chunks.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
