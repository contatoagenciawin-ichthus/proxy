// Local-only HTTP verification against a real Next build; synthetic identity, no OAuth calls.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { encode } from 'next-auth/jwt';
const secret = 'LOCAL_SYNTHETIC_SESSION_SECRET_NOT_FOR_DEPLOYMENT_2026';
const base = 'http://localhost:3117';
async function run(enabled, check) {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', 'localhost', '-p', '3117'], {
    env: { ...process.env, NODE_ENV: 'development', PROXY_ADMIN_ENABLED: enabled,
      PROXY_ADMIN_ORIGIN: base, PROXY_ADMIN_AUTH_SECRET: secret,
      PROXY_ADMIN_GITHUB_ID: 'local-fixture', PROXY_ADMIN_GITHUB_SECRET: 'local-fixture', PROXY_ADMIN_GITHUB_IDS: '123' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = ''; server.stdout.on('data', b => { logs += String(b); }); server.stderr.on('data', b => { logs += String(b); });
  try {
    let ready = false;
    for (let i=0;i<40;i++) {
      if (server.exitCode !== null) break;
      try { if ((await fetch(base + '/meta/admin/login', {signal: AbortSignal.timeout(2000)})).status === 200) { ready=true; break; } } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    assert.ok(ready, 'local Next server starts: ' + logs.slice(0,1500));
    await check();
  } finally { if (server.exitCode === null) { server.kill('SIGKILL'); await new Promise(r => server.once('exit',r)); } }
}
const sessionCookie = async (id) => 'proxy-admin-session=' + await encode({ token: { proxyAdminId: id, sub: id }, secret, salt: 'proxy-admin-session', maxAge: 3600 });
await run('true', async () => {
  for (const path of ['/meta/admin', '/meta/admin/connections/ichthus', '/meta/admin/connections/eduardo-brasil']) {
    const r=await fetch(base+path, {redirect:'manual'});
    assert.equal(r.status,307);assert.equal(r.headers.get('location'),'/meta/admin/login');
    assert.ok(!(await r.text()).includes('107697061976892'));
  }
  const login=await fetch(base+'/meta/admin/login');assert.ok((await login.text()).includes('Continuar com GitHub'));
  const good=await sessionCookie('123');
  const r=await fetch(base+'/meta/admin',{headers:{cookie:good}});
  assert.equal(r.status,200);const html=await r.text();
  for(const name of ['Eduardo Brasil','LA Climatização','Ichthus Marketing']) assert.ok(html.includes(name), name);
  assert.match(r.headers.get('cache-control'),/no-store/);
  assert.equal(r.headers.get('x-frame-options'),'DENY');
  const detail=await fetch(base+'/meta/admin/connections/ichthus',{headers:{cookie:good}});assert.equal(detail.status,200);assert.ok((await detail.text()).includes('107697061976892'));
  assert.equal((await fetch(base+'/meta/admin/connections/not-a-client',{headers:{cookie:good}})).status,404);
  for(const cookie of [await sessionCookie('999'), good+'tampered', 'better-auth.session_token=tenant-admin']) {
    assert.equal((await fetch(base+'/meta/admin',{headers:{cookie},redirect:'manual'})).status,307);
  }
  const unauthRsc=await fetch(base+'/meta/admin?_rsc=fixture',{headers:{RSC:'1'},redirect:'manual'});assert.ok(!(await unauthRsc.text()).includes('Eduardo Brasil'));
  const session=await fetch(base+'/api/meta/admin/auth/session',{headers:{cookie:good}});assert.equal(session.status,200);const data=await session.json();assert.equal(data.user.id,'123');assert.equal(Object.hasOwn(data,'access_token'),false);
  const csrf=await fetch(base+'/api/meta/admin/auth/csrf');assert.equal(csrf.status,200);assert.ok((await csrf.json()).csrfToken);
  const cross=await fetch(base+'/api/meta/admin/auth/session',{headers:{cookie:good,origin:'https://evil.invalid'}});assert.equal(cross.status,403);
  // Existing review route still renders. Do not exercise POST or any Meta operation.
  assert.equal((await fetch(base+'/meta/review')).status,200);
  console.log('HTTP enabled: login, protected overview/details, real encrypted session, revoked/forged/CRM sessions, RSC, CSRF, origin and legacy page passed');
});
await run('false',async()=>{
  const page=await fetch(base+'/meta/admin/login');const html=await page.text();assert.ok(html.includes('Acesso em preparação'));assert.ok(!html.includes('Continuar com GitHub'));assert.ok(!html.includes('Eduardo Brasil'));
  assert.equal((await fetch(base+'/api/meta/admin/auth/session')).status,503);
  assert.equal((await fetch(base+'/meta/admin',{headers:{cookie:await sessionCookie('123')},redirect:'manual'})).status,307);
  console.log('HTTP disabled: no inventory leakage and auth endpoints fail closed');
});
