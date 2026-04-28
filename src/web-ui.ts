// Web UI — 单页面邮件管理面板
import { Env } from './index';

export async function handleWebUI(request: Request, env: Env): Promise<Response> {
  const html = getHTML(env);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    }
  });
}

function getHTML(env: Env): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloud-Mail — ${env.DOMAIN}</title>
<style>
  :root {
    --bg: #0f0f0f;
    --surface: #1a1a1a;
    --border: #2a2a2a;
    --text: #e0e0e0;
    --text-secondary: #888;
    --accent: #6366f1;
    --accent-hover: #818cf8;
    --danger: #ef4444;
    --success: #22c55e;
    --warning: #f59e0b;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }
  .app { display: flex; height: 100vh; }
  .sidebar {
    width: 300px;
    min-width: 300px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
  }
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-header h1 {
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
  }
  .sidebar-header .domain {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
  .stats {
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    border-bottom: 1px solid var(--border);
  }
  .stat {
    text-align: center;
    flex: 1;
  }
  .stat .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--accent);
  }
  .stat .label {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
  .address-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
  .address-item {
    padding: 12px 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 3px solid transparent;
    transition: all 0.15s;
  }
  .address-item:hover { background: rgba(99,102,241,0.05); }
  .address-item.active {
    background: rgba(99,102,241,0.1);
    border-left-color: var(--accent);
  }
  .address-item .addr {
    font-size: 14px;
    font-weight: 500;
  }
  .address-item .badge {
    background: var(--accent);
    color: white;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
  }
  .address-item .badge.zero { background: var(--border); color: var(--text-secondary); }
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .main-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .main-header h2 {
    font-size: 16px;
    font-weight: 600;
  }
  .main-header .actions {
    display: flex;
    gap: 8px;
  }
  .btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: white; }
  .btn.primary:hover { background: var(--accent-hover); }
  .btn.danger { color: var(--danger); }
  .btn.danger:hover { border-color: var(--danger); background: rgba(239,68,68,0.1); }
  .email-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
  }
  .email-item {
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .email-item:hover { border-color: var(--accent); }
  .email-item.unread { border-left: 3px solid var(--accent); }
  .email-item .meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
  }
  .email-item .from { color: var(--accent-hover); font-weight: 500; }
  .email-item .time { color: var(--text-secondary); }
  .email-item .subject { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .email-item .preview {
    color: var(--text-secondary);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .email-detail {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }
  .email-detail .detail-header {
    margin-bottom: 20px;
  }
  .email-detail .detail-header h3 {
    font-size: 20px;
    margin-bottom: 12px;
  }
  .email-detail .detail-meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .email-detail .detail-meta strong { color: var(--text); }
  .email-detail .detail-body {
    background: var(--surface);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--border);
    line-height: 1.6;
    margin-top: 16px;
    white-space: pre-wrap;
    font-size: 14px;
  }
  .empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
  }
  .empty .icon { font-size: 48px; margin-bottom: 16px; }
  .password-prompt {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--bg);
  }
  .password-prompt form {
    background: var(--surface);
    padding: 40px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  .password-prompt input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 14px;
    margin: 16px 0;
  }
  .password-prompt input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .loading { text-align: center; padding: 40px; color: var(--text-secondary); }
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    width: 400px;
  }
  .modal h3 { margin-bottom: 16px; }
  .modal textarea {
    width: 100%; height: 150px;
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text); border-radius: 6px;
    padding: 10px; font-size: 13px; margin-bottom: 16px;
  }
  .toast {
    position: fixed; bottom: 20px; right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 200;
    animation: slideIn 0.3s ease;
  }
  .toast.success { background: var(--success); color: white; }
  .toast.error { background: var(--danger); color: white; }
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @media (max-width: 768px) {
    .sidebar { width: 100%; min-width: 100%; }
    .app { flex-direction: column; }
  }
</style>
</head>
<body>
<div id="app">
  <div id="password-screen" class="password-prompt">
    <form onsubmit="event.preventDefault(); setPassword(document.getElementById('pw').value)">
      <h2>🔐 Cloud-Mail Admin</h2>
      <p style="color:#888;font-size:13px">请输入管理密码</p>
      <input id="pw" type="password" placeholder="Admin Password" autofocus>
      <button type="submit" class="btn primary" style="width:100%;margin-top:8px">登录</button>
    </form>
  </div>
  <div id="main-app" class="app" style="display:none">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>📧 Cloud-Mail</h1>
        <div class="domain">@${env.DOMAIN}</div>
      </div>
      <div class="stats">
        <div class="stat"><div class="value" id="stat-total">0</div><div class="label">总邮件</div></div>
        <div class="stat"><div class="value" id="stat-unread">0</div><div class="label">未读</div></div>
        <div class="stat"><div class="value" id="stat-addr">0</div><div class="label">地址</div></div>
      </div>
      <div class="address-list" id="address-list"></div>
    </div>
    <div class="main">
      <div class="main-header">
        <h2 id="main-title">选择邮箱地址查看邮件</h2>
        <div class="actions">
          <button class="btn primary" onclick="showCreateModal()">+ 新建地址</button>
          <button class="btn" onclick="refresh()">🔄 刷新</button>
        </div>
      </div>
      <div id="main-content" class="email-list">
        <div class="empty"><div class="icon">📬</div><p>选择一个邮箱地址查看邮件</p></div>
      </div>
    </div>
  </div>
</div>

<!-- Create Address Modal -->
<div id="create-modal" class="modal-overlay" style="display:none">
  <div class="modal">
    <h3>创建邮箱地址</h3>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">
      一行一个地址，例如:<br>
      aws-reg@${env.DOMAIN}<br>
      github-notif@${env.DOMAIN}
    </p>
    <textarea id="create-input" placeholder="address1@${env.DOMAIN}&#10;address2@${env.DOMAIN}"></textarea>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn" onclick="hideCreateModal()">取消</button>
      <button class="btn primary" onclick="createAddresses()">创建</button>
    </div>
  </div>
</div>

<script>
let PASSWORD = '';
let currentAddress = null;
let currentView = 'list'; // list | detail

function api(path, opts = {}) {
  const url = '/admin/api' + path;
  const headers = { ...opts.headers, 'x-admin-password': PASSWORD };
  if (opts.body && typeof opts.body === 'object') {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(url, { ...opts, headers });
}

async function setPassword(pw) {
  PASSWORD = pw;
  const resp = await api('/stats');
  if (resp.ok) {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    init();
  } else {
    toast('密码错误', 'error');
  }
}

async function init() {
  await Promise.all([loadStats(), loadAddresses()]);
  setInterval(loadStats, 30000);
}

async function loadStats() {
  const resp = await api('/stats');
  if (resp.ok) {
    const { data } = await resp.json();
    document.getElementById('stat-total').textContent = data.totalEmails;
    document.getElementById('stat-unread').textContent = data.unreadEmails;
    document.getElementById('stat-addr').textContent = data.totalAddresses;
  }
}

async function loadAddresses() {
  const resp = await api('/addresses?active=1');
  if (resp.ok) {
    const { data } = await resp.json();
    const list = document.getElementById('address-list');
    
    // 获取每个地址的未读数
    const unreadMap = {};
    for (const addr of data) {
      const eresp = await api('/emails?address=' + encodeURIComponent(addr.address) + '&unread=1&limit=1');
      if (eresp.ok) {
        const { total } = await eresp.json();
        unreadMap[addr.address] = total;
      }
    }

    list.innerHTML = data.map(addr => {
      const unread = unreadMap[addr.address] || 0;
      const active = currentAddress === addr.address ? ' active' : '';
      const badgeClass = unread > 0 ? '' : ' zero';
      return '<div class="address-item' + active + '" onclick="selectAddress(\\'' + escapeHtml(addr.address) + '\\')">' +
        '<span class="addr">' + escapeHtml(addr.address) + '</span>' +
        '<span class="badge' + badgeClass + '">' + unread + '</span>' +
        '</div>';
    }).join('') || '<div class="empty" style="padding:20px"><p>暂无邮箱地址</p></div>';
  }
}

async function selectAddress(address) {
  currentAddress = address;
  currentView = 'list';
  document.getElementById('main-title').textContent = '📧 ' + address;
  
  const resp = await api('/emails?address=' + encodeURIComponent(address) + '&limit=100');
  if (resp.ok) {
    const { data } = await resp.json();
    const content = document.getElementById('main-content');
    
    if (!data.length) {
      content.innerHTML = '<div class="empty"><div class="icon">📭</div><p>暂无邮件</p></div>';
      return;
    }
    
    content.innerHTML = data.map(mail => {
      const time = new Date(mail.received_at).toLocaleString('zh-CN');
      const unread = !mail.is_read ? ' unread' : '';
      return '<div class="email-item' + unread + '" onclick="viewEmail(\\'' + mail.id + '\\')">' +
        '<div class="meta"><span class="from">' + escapeHtml(mail.sender) + '</span><span class="time">' + time + '</span></div>' +
        '<div class="subject">' + escapeHtml(mail.subject || '(无主题)') + '</div>' +
        '</div>';
    }).join('');
  }
  
  loadAddresses(); // 刷新 sidebar 高亮
}

async function viewEmail(id) {
  const resp = await api('/emails/' + id);
  if (resp.ok) {
    const { data } = await resp.json();
    currentView = 'detail';
    document.getElementById('main-title').textContent = data.subject || '(无主题)';
    
    const time = new Date(data.received_at).toLocaleString('zh-CN');
    document.getElementById('main-content').innerHTML = 
      '<div class="email-detail">' +
      '<div class="detail-header"><h3>' + escapeHtml(data.subject || '(无主题)') + '</h3></div>' +
      '<div class="detail-meta">' +
        '<strong>发件人:</strong><span>' + escapeHtml(data.sender) + '</span>' +
        '<strong>收件人:</strong><span>' + escapeHtml(data.recipient) + '</span>' +
        '<strong>时间:</strong><span>' + time + '</span>' +
      '</div>' +
      '<div class="detail-body">' + escapeHtml(data.body_text || '(无文本内容)') + '</div>' +
      '<div style="margin-top:16px;display:flex;gap:8px">' +
        '<button class="btn" onclick="selectAddress(\\'' + escapeHtml(data.recipient) + '\\')">← 返回列表</button>' +
        '<button class="btn danger" onclick="deleteEmail(\\'' + data.id + '\\')">🗑 删除</button>' +
      '</div></div>';
  }
  
  loadAddresses(); // 刷新未读数
}

async function deleteEmail(id) {
  if (!confirm('确定删除此邮件？')) return;
  const resp = await api('/emails/' + id, { method: 'DELETE' });
  if (resp.ok) {
    toast('已删除', 'success');
    if (currentAddress) selectAddress(currentAddress);
  }
}

async function createAddresses() {
  const input = document.getElementById('create-input').value.trim();
  if (!input) return;
  const addresses = input.split('\\n').map(s => s.trim()).filter(Boolean);
  const resp = await api('/addresses', { method: 'POST', body: { addresses } });
  if (resp.ok) {
    const { data } = await resp.json();
    toast('已创建 ' + data.created + ' 个地址', 'success');
    hideCreateModal();
    loadAddresses();
  } else {
    const { error } = await resp.json();
    toast(error || '创建失败', 'error');
  }
}

async function refresh() {
  if (currentAddress) await selectAddress(currentAddress);
  else await loadAddresses();
  await loadStats();
}

function showCreateModal() {
  document.getElementById('create-modal').style.display = 'flex';
  document.getElementById('create-input').focus();
}
function hideCreateModal() {
  document.getElementById('create-modal').style.display = 'none';
}

function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
</script>
</body>
</html>`;
}
