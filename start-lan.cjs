'use strict';
// Interactive launcher only. Importing this file never starts a listener.
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline/promises');
const { spawn } = require('node:child_process');
function privateAddress(address) {
  if (typeof address !== 'string' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) return false;
  const octets = address.split('.'); const p = octets.map(Number);
  if (p.some((n, i) => n > 255 || String(n) !== octets[i])) return false;
  return p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
}
function addresses(interfaces) {
  const result = [], seen = new Set();
  for (const [name, entries] of Object.entries(interfaces)) for (const entry of entries || []) {
    if (entry.internal || !privateAddress(entry.address) || seen.has(entry.address)) continue;
    seen.add(entry.address); result.push({ name, address: entry.address });
  }
  return result;
}
function launchPlan(candidates, selection, confirmation, inherited = {}) {
  if (!/^[1-9]\d*$/.test(selection)) throw Error('INVALID_SELECTION');
  const selected = candidates[Number(selection) - 1];
  if (!selected || !privateAddress(selected.address)) throw Error('INVALID_SELECTION');
  if (confirmation !== 'LAN') throw Error('LAN_NOT_CONFIRMED');
  // Fixed test port; never inherit a stale local launch's wildcard/IP/port.
  return { address: selected.address, env: { ...inherited, LAST_WHISTLE_LAN_ADDRESS: selected.address,
    LAST_WHISTLE_LAN_TEST: 'I_ACCEPT_TRUSTED_LAN_ONLY', LAST_WHISTLE_PORT: '4317' } };
}
async function main() {
  const candidates = addresses(os.networkInterfaces());
  if (!candidates.length) throw Error('NO_PRIVATE_NETWORK_ADDRESS');
  console.log('末班汽笛 · 手动局域网测试\n仅限可信同一网络和虚拟测试身份。HTTP未加密，不用于正式保密游戏。\n不修改防火墙、不发布公网、不自动打开浏览器。');
  candidates.forEach((item, i) => console.log(`${i + 1}. ${item.name}  ${item.address}`));
  console.log('请选择实际连接手机的网卡。VPN、虚拟网卡不保证手机能访问；不知道可直接回车取消。');
  const input = readline.createInterface({ input: process.stdin, output: process.stdout });
  let plan;
  try {
    const selection = (await input.question('网卡序号（回车取消） ')).trim();
    if (!selection) { console.log('已取消，没有启动服务。'); return; }
    const confirmation = (await input.question('确认只作可信局域网测试，请输入大写 LAN（其他输入取消） ')).trim();
    if (confirmation !== 'LAN') { console.log('已取消，没有启动服务。'); return; }
    plan = launchPlan(candidates, selection, confirmation, process.env);
  } finally { input.close(); }
  console.log(`准备启动 http://${plan.address}:4317/ ，请等服务器成功监听提示后再分享。\n使用独立局域网测试存档。Ctrl+C停止；端口占用时不杀其他进程。`);
  const child = spawn(process.execPath, [path.join(__dirname, 'server.cjs')], { env: plan.env, stdio: 'inherit' });
  // Windows console sends Ctrl+C to the foreground child too; let it close its
  // server instead of abruptly terminating the wrapper and orphaning the UI.
  const stop = () => { if (process.platform !== 'win32') child.kill('SIGINT'); };
  process.on('SIGINT', stop);
  child.once('error', error => { console.error('启动失败:', error.message); process.exitCode = 1; });
  child.once('exit', code => { process.off('SIGINT', stop); process.exitCode = code === null ? 1 : code; });
}
if (require.main === module) main().catch(error => { console.error('未启动或启动失败:', error.message); process.exitCode = 1; });
module.exports = { addresses, launchPlan };
