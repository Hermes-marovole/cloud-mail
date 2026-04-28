// Admin API — REST 接口管理邮箱和邮件
// 鉴权: x-admin-password header

import { Env } from './index';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export async function handleAdminRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // 鉴权
  const password = request.headers.get('x-admin-password');
  if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/admin/api', '');
  const method = request.method;

  try {
    // GET /addresses — 列出所有地址
    if (path === '/addresses' && method === 'GET') {
      const active = url.searchParams.get('active');
      let query = 'SELECT address, label, notes, created_at, active FROM addresses';
      const params: any[] = [];
      if (active === '1') {
        query += ' WHERE active = 1';
      }
      query += ' ORDER BY created_at DESC LIMIT 200';
      
      const { results } = await env.DB.prepare(query).all();
      return json({ success: true, data: results, total: results.length });
    }

    // POST /addresses — 创建新地址（多个）
    if (path === '/addresses' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const addresses: string[] = body.addresses || [body.address].filter(Boolean);
      const label = body.label || '';

      if (!addresses.length) {
        return json({ success: false, error: '需要 address 或 addresses 字段' }, 400);
      }

      const stmt = env.DB.prepare(
        'INSERT OR REPLACE INTO addresses (address, label, notes, active) VALUES (?, ?, ?, 1)'
      );

      const batch = addresses.map(addr => stmt.bind(addr.toLowerCase().trim(), label, body.notes || ''));
      await env.DB.batch(batch);

      return json({ success: true, data: { created: addresses.length, addresses } });
    }

    // DELETE /addresses?address=xxx — 删除地址
    if (path === '/addresses' && method === 'DELETE') {
      const address = url.searchParams.get('address');
      if (!address) return json({ success: false, error: '需要 address 参数' }, 400);

      await env.DB.prepare('DELETE FROM addresses WHERE address = ?').bind(address).run();
      return json({ success: true, message: `已删除 ${address}` });
    }

    // GET /emails — 列出邮件
    if (path === '/emails' && method === 'GET') {
      const address = url.searchParams.get('address');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const unread = url.searchParams.get('unread');

      let query = 'SELECT id, recipient, sender, subject, received_at, is_read FROM emails';
      const conditions: string[] = [];
      const params: any[] = [];

      if (address) {
        conditions.push('recipient = ?');
        params.push(address.toLowerCase().trim());
      }
      if (unread === '1') {
        conditions.push('is_read = 0');
      }
      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY received_at DESC LIMIT ? OFFSET ?';
      params.push(Math.min(limit, 100), offset);

      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM emails';
      if (conditions.length) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }
      const countResult = await env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first<{total: number}>();
      
      return json({ success: true, data: results, total: countResult?.total || 0 });
    }

    // GET /emails/:id — 获取单封邮件详情
    if (path.startsWith('/emails/') && method === 'GET') {
      const id = path.replace('/emails/', '');
      const email = await env.DB.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();
      
      if (!email) return json({ success: false, error: '邮件不存在' }, 404);
      
      // 标记已读
      await env.DB.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').bind(id).run();
      
      return json({ success: true, data: email });
    }

    // DELETE /emails/:id — 删除单封邮件
    if (path.startsWith('/emails/') && method === 'DELETE') {
      const id = path.replace('/emails/', '');
      await env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
      return json({ success: true, message: `已删除邮件 ${id}` });
    }

    // DELETE /emails — 批量删除 (body: {ids: [...]})
    if (path === '/emails' && method === 'DELETE') {
      const body: any = await request.json().catch(() => ({}));
      const ids: string[] = body.ids || [];
      if (!ids.length) return json({ success: false, error: '需要 ids' }, 400);

      const stmt = env.DB.prepare('DELETE FROM emails WHERE id = ?');
      await env.DB.batch(ids.map(id => stmt.bind(id)));
      return json({ success: true, message: `已删除 ${ids.length} 封邮件` });
    }

    // GET /stats — 统计信息
    if (path === '/stats' && method === 'GET') {
      const totalEmails = await env.DB.prepare('SELECT COUNT(*) as total FROM emails').first<{total: number}>();
      const totalAddresses = await env.DB.prepare('SELECT COUNT(*) as total FROM addresses WHERE active = 1').first<{total: number}>();
      const unreadEmails = await env.DB.prepare('SELECT COUNT(*) as total FROM emails WHERE is_read = 0').first<{total: number}>();
      const latestEmail = await env.DB.prepare('SELECT received_at FROM emails ORDER BY received_at DESC LIMIT 1').first<{received_at: number}>();

      return json({
        success: true,
        data: {
          totalEmails: totalEmails?.total || 0,
          totalAddresses: totalAddresses?.total || 0,
          unreadEmails: unreadEmails?.total || 0,
          latestEmailAt: latestEmail?.received_at || null,
        }
      });
    }

    return json({ success: false, error: '未知的 API 路径' }, 404);
  } catch (err: any) {
    console.error('API Error:', err);
    return json({ success: false, error: err.message || 'Internal Error' }, 500);
  }
}

function json(data: ApiResponse, status = 200): Response {
  const resp = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    }
  });
  return resp;
}
