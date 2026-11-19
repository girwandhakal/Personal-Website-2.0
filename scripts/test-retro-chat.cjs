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
  assert.equal((await handleChat(request([question]), async () => Response.json({ allowed: false }))).status, 422);
  const response = await handleChat(request([question]), async (url, init) => {
    if (url === process.env.SAFETY_SERVICE_URL) return Response.json({ allowed: true });
    const payload = JSON.parse(init.body);
    assert.equal(payload.stream, true);
    assert.match(payload.messages[0].content, /teleprompter for slide decks/);
    assert.deepEqual(payload.messages[1], question);
    return new Response(mockProvider, { headers: { 'content-type': 'text/event-stream' } });
  });
  assert.equal(response.status, 200);
  const dom = new JSDOM(readFileSync('retro/chat.html', 'utf8'), { runScripts: 'outside-only' });
  const { document } = dom.window;
  dom.window.TextDecoderStream = TextDecoderStream;
  dom.window.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { messages: [question] });
    return response;
  };
  dom.window.eval(readFileSync('retro/chat.js', 'utf8'));
  const form = document.querySelector('form');
  assert.equal(form.hidden, false);
  document.querySelector('textarea').value = question.content;
  form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
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
  dom.window.close();
  console.log('PASS: chat grounding, input checks, and browser rendering of split stream chunks.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
