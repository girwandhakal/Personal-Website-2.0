const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '../retro');
const script = fs.readFileSync(path.join(root, 'navigation.js'), 'utf8');
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'))
  .concat(fs.readdirSync(path.join(root, 'projects')).map(file => `projects/${file}`));

for (const page of pages) {
  const file = path.join(root, page);
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
    url: `https://girwan.com/${page}`, runScripts: 'outside-only'
  });
  const { document } = dom.window;
  const font = document.querySelector('link[rel="preload"][as="font"]');
  assert(font, `${page}: missing font preload`);
  assert(font.hasAttribute('crossorigin'), `${page}: font preload requires CORS`);
  assert(fs.existsSync(path.resolve(path.dirname(file), font.getAttribute('href'))));
  const navigation = document.querySelector('script[src$="navigation.js"]');
  assert(navigation && navigation.defer, `${page}: missing deferred navigation script`);
  dom.window.eval(script);

  const link = document.querySelector('.site-nav [aria-current="page"]');
  // Suppress jsdom's unimplemented native navigation after the handler has run.
  document.addEventListener('click', event => event.preventDefault());
  const shouldStay = !page.startsWith('projects/');
  const probe = () => {
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    let prevented;
    document.querySelector('.site-nav').addEventListener('click', () => { prevented = event.defaultPrevented; }, { once: true });
    link.dispatchEvent(event);
    return prevented;
  };
  assert.equal(probe(), shouldStay, `${page}: current link behavior`);
  dom.window.close();
}

const dom = new JSDOM('<nav class="site-nav"><a href="/index.html"><span>GD</span></a></nav>', {
  url: 'https://girwan.com/', runScripts: 'outside-only'
});
dom.window.eval(script);
const link = dom.window.document.querySelector('a');
const nav = dom.window.document.querySelector('nav');
let prevented;
nav.addEventListener('click', event => { prevented = event.defaultPrevented; event.preventDefault(); });
function click(href, options = {}) {
  link.href = href;
  link.firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options }));
  return prevented;
}
assert.equal(click('/index.html'), true, 'home aliases must not reload');
assert.equal(click('/experience.html'), false, 'other pages must navigate');
assert.equal(click('/?preview=1'), false, 'query changes must navigate');
assert.equal(click('/#main'), false, 'fragment navigation must work');
assert.equal(click('https://example.com/'), false, 'external links must work');
for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
  assert.equal(click('/', { [modifier]: true }), false, `${modifier} must keep native behavior`);
}
assert.equal(click('/', { button: 1 }), false, 'middle clicks must keep native behavior');
link.target = '_blank';
assert.equal(click('/'), false, 'new tab targets must work');
link.removeAttribute('target');
link.setAttribute('download', '');
assert.equal(click('/'), false, 'downloads must work');
dom.window.close();
console.log(`PASS: ${pages.length} pages preload the font and load navigation; current-page clicks, home aliases, case studies, modifiers, targets, fragments, queries, and downloads behave correctly.`);
