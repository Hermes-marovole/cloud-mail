// Cloud-Mail: 多账号邮箱 Worker
// 基于 Cloudflare Email Routing catch-all + D1 存储
// 域名: neumabio.xyz

import { EmailMessage } from 'cloudflare:email';
import { parseEmail } from './email-parser';
import { handleAdminRequest } from './admin-api';
import { handleWebUI } from './web-ui';

export interface Env {
  DB: D1Database;
  DOMAIN: string;
  ADMIN_PASSWORD?: string;
}

export default {
  // 处理 HTTP 请求 (Admin API + Web UI)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // Admin API
    if (path.startsWith('/admin/api/')) {
      return handleAdminRequest(request, env, ctx);
    }

    // Web UI
    if (path.startsWith('/admin') || path === '/') {
      return handleWebUI(request, env);
    }

    // Health check
    if (path === '/health') {
      return corsResponse(new Response(JSON.stringify({ ok: true, domain: env.DOMAIN }), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    return new Response('Not Found', { status: 404 });
  },

  // 处理 Email Routing 转发的邮件
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      const recipient = message.to.toLowerCase().trim();
      const sender = message.from.toLowerCase().trim();

      console.log(`📧 收到邮件: ${sender} → ${recipient}`);

      // 解析邮件内容
      const parsed = await parseEmail(message);

      // 生成唯一 ID
      const id = crypto.randomUUID();

      // 存储到 D1
      await env.DB.prepare(
        `INSERT INTO emails (id, recipient, sender, subject, body_text, body_html, raw_email, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(id, recipient, sender, parsed.subject, parsed.bodyText, parsed.bodyHtml, parsed.rawEmail, Date.now())
        .run();

      // 确保地址在 addresses 表中存在
      await env.DB.prepare(
        `INSERT OR IGNORE INTO addresses (address, label) VALUES (?, 'auto-created')`
      )
        .bind(recipient)
        .run();

      console.log(`✅ 邮件已存储: ${id} → ${recipient}`);
    } catch (err) {
      console.error('❌ 处理邮件失败:', err);
    }
  }
};

function corsResponse(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  return response;
}

export { corsResponse };
