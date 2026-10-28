import assert from 'node:assert/strict';
import { validateContact, handleContact } from '../retro/api/contact.mjs';

// 1. Validation tests
assert.equal(validateContact({ name: '', email: 'test@example.com', message: 'Hello world, this is a test!' }).ok, false);
assert.equal(validateContact({ name: 'Alice', email: 'invalid-email', message: 'Hello world, this is a test!' }).ok, false);
assert.equal(validateContact({ name: 'Alice', email: 'alice@example.com', message: 'Short' }).ok, false);
const valid = validateContact({ name: 'Alice Smith', email: 'alice@example.com', message: 'Hello Girwan, love your retro portfolio site!' });
assert.equal(valid.ok, true);
assert.equal(valid.data.name, 'Alice Smith');
assert.equal(valid.data.email, 'alice@example.com');

// 2. Honeypot check
const honeypotReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
  body: JSON.stringify({ name: 'SpamBot', email: 'bot@spam.com', message: 'Buy cheap things now!', website: 'http://spam.com' })
});
let fetchCalled = false;
const mockFetch = async () => { fetchCalled = true; return new Response('OK'); };
const honeypotRes = await handleContact(honeypotReq, mockFetch);
assert.equal(honeypotRes.status, 200);
const honeypotData = await honeypotRes.json();
assert.equal(honeypotData.ok, true);
assert.equal(fetchCalled, false, 'Honeypot should never trigger EmailJS fetch');

// 3. Method validation
const getReq = new Request('http://localhost:3000/api/contact', {
  method: 'GET',
  headers: { 'x-forwarded-for': '10.0.0.2' }
});
const getRes = await handleContact(getReq, mockFetch);
assert.equal(getRes.status, 405);

// 4. Missing EmailJS config fails safe with 503
const origSecret = process.env.EMAILJS_SECRET;
process.env.EMAILJS_SECRET = '';
const unconfiguredReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.3' },
  body: JSON.stringify({ name: 'Bob', email: 'bob@example.com', message: 'Test message that is long enough.' })
});
const unconfiguredRes = await handleContact(unconfiguredReq, mockFetch);
assert.equal(unconfiguredRes.status, 503);

// 5. Successful submission with EmailJS params verification
process.env.EMAILJS_SECRET = 'service_123';
process.env.EMAILJS_TEMPLATE_ID = 'template_456';
process.env.EMAILJS_PUBLIC_KEY = 'public_789';

let capturedPayload = null;
const emailMock = async (url, options) => {
  capturedPayload = JSON.parse(options.body);
  return new Response('OK', { status: 200 });
};

const sendReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.4' },
  body: JSON.stringify({ name: 'Carol Danvers', email: 'carol@example.com', message: 'Looking forward to connecting with you!' })
});
const sendRes = await handleContact(sendReq, emailMock);
assert.equal(sendRes.status, 200);
const sendData = await sendRes.json();
assert.equal(sendData.ok, true);
assert.equal(capturedPayload.service_id, 'service_123');
assert.equal(capturedPayload.template_id, 'template_456');
assert.equal(capturedPayload.user_id, 'public_789');
assert.equal(capturedPayload.template_params.name, 'Carol Danvers');
assert.equal(capturedPayload.template_params.from_name, 'Carol Danvers');
assert.equal(capturedPayload.template_params.email, 'carol@example.com');
assert.equal(capturedPayload.template_params.reply_to, 'carol@example.com');

// 6. Rate limiting verification (second immediate request from same IP should return 429)
const secondReq = new Request('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.4' },
  body: JSON.stringify({ name: 'Carol Danvers', email: 'carol@example.com', message: 'Another immediate message!' })
});
const secondRes = await handleContact(secondReq, emailMock);
assert.equal(secondRes.status, 429);

// Restore env
if (origSecret) process.env.EMAILJS_SECRET = origSecret;

console.log('PASS: contact validation, honeypot trapping, method checking, rate limiting, and EmailJS dispatch.');
