import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { setLastCrawl } from '../src/state.js';

const FIXTURE_HTML = `
  <html><body><table>
    <tr class="athing" id="1">
      <td class="title"><span class="titleline"><a href="#">First Post</a></span></td>
    </tr>
    <tr>
      <td class="subtext">
        <span class="subline">
          <span class="score">150 points</span>
          <a href="item?id=1">45&nbsp;comments</a>
        </span>
      </td>
    </tr>
    <tr class="athing" id="2">
      <td class="title"><span class="titleline"><a href="#">Second Post</a></span></td>
    </tr>
    <tr>
      <td class="subtext">
        <span class="subline">
          <span class="score">42 points</span>
          <a href="item?id=2">discuss</a>
        </span>
      </td>
    </tr>
  </table></body></html>
`;

let apiServer;
let apiBaseUrl;
let fixtureServer;
let fixtureUrl;

before(async () => {
  apiServer = app.listen(0);
  await new Promise((resolve) => apiServer.once('listening', resolve));
  apiBaseUrl = `http://localhost:${apiServer.address().port}`;

  fixtureServer = http
    .createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(FIXTURE_HTML);
    })
    .listen(0);
  await new Promise((resolve) => fixtureServer.once('listening', resolve));
  fixtureUrl = `http://localhost:${fixtureServer.address().port}`;
});

after(() => {
  apiServer.close();
  fixtureServer.close();
});

// A single top-level test with awaited subtests, since lastCrawl (src/state.js)
// is shared, in-memory, module-level state with no reset between cases —
// order matters, and `await`ing each subtest guarantees it.
test('API v1 endpoints', async (t) => {
  await t.test('GET /entries/filter/points -> 400 before any crawl', async () => {
    const res = await fetch(`${apiBaseUrl}/api/v1/entries/filter/points?min=0`);
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.error, /crawl/i);
  });

  await t.test('POST /crawl fetches and parses entries from the target page', async () => {
    const res = await fetch(`${apiBaseUrl}/api/v1/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fixtureUrl }),
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.count, 2);
    assert.deepEqual(data.entries, [
      { number: 1, title: 'First Post', points: 150, comments: 45 },
      { number: 2, title: 'Second Post', points: 42, comments: 0 },
    ]);
  });

  await t.test('GET /entries/filter/points filters by minimum points', async () => {
    setLastCrawl({
      url: 'https://example.com',
      entries: [
        { number: 1, title: 'High', points: 200, comments: 10 },
        { number: 2, title: 'Low', points: 5, comments: 1 },
      ],
    });

    const res = await fetch(`${apiBaseUrl}/api/v1/entries/filter/points?min=100`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.count, 1);
    assert.equal(data.entries[0].title, 'High');
  });

  await t.test('GET /entries/filter/comments filters by minimum comments', async () => {
    setLastCrawl({
      url: 'https://example.com',
      entries: [
        { number: 1, title: 'Chatty', points: 10, comments: 80 },
        { number: 2, title: 'Quiet', points: 10, comments: 2 },
      ],
    });

    const res = await fetch(`${apiBaseUrl}/api/v1/entries/filter/comments?min=50`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.count, 1);
    assert.equal(data.entries[0].title, 'Chatty');
  });

  await t.test('GET /audit records the filter calls made above', async () => {
    const res = await fetch(`${apiBaseUrl}/api/v1/audit`);
    const rows = await res.json();

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(rows));
    assert.ok(rows.some((r) => r.filter_type === 'points'));
    assert.ok(rows.some((r) => r.filter_type === 'comments'));
  });
});
