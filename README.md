# Cloud-Mail — neumabio.xyz 多账号邮箱服务

基于 Cloudflare Workers + D1 + Email Routing 的零成本自建邮箱系统。
一个域名，无限收件地址，统一 Web 管理面板。

## 架构

```
*@neumabio.xyz ──(Email Routing catch-all)──▶ Worker (cloud-mail)
                                                  │
                                          ┌───────┴───────┐
                                          │  email handler │  ← 收件、解析、存储
                                          │  fetch handler │  ← Admin API + Web UI
                                          └───────┬───────┘
                                                  │
                                          ┌───────┴───────┐
                                          │     D1 数据库  │
                                          │  emails 表     │
                                          │  addresses 表  │
                                          └───────────────┘
```

## 项目结构

```
cloud-mail/
├── src/
│   ├── index.ts          # Worker 入口 (fetch + email handler)
│   ├── email-parser.ts   # 邮件解析 (postal-mime)
│   ├── admin-api.ts      # REST API
│   └── web-ui.ts         # 管理面板 Web UI
├── scripts/
│   └── create-addresses.ts  # 批量生成邮箱地址
├── schema.sql            # D1 数据库 Schema
├── wrangler.toml
└── package.json
```

## 已部署

- Worker: `cloud-mail` ✅
- D1 数据库: `cloud-mail-db` (8eb5c417-3d06-4423-9725-62ee6746004c) ✅
- Worker 路由: `mail.neumabio.xyz/*` ✅
- Admin 密码: `neumabio2026!` ✅

## 🚨 需要手动配置（Cloudflare Dashboard）

### 1. 添加 DNS 记录

进入 neumabio.xyz → DNS → 添加记录：
- 类型: A
- 名称: mail
- IPv4: 192.0.2.1
- 代理: ✅ 开启（橙色云朵）
- TTL: Auto

### 2. 启用 Email Routing

进入 neumabio.xyz → Email → Email Routing：
1. 如果未启用，点击"Enable Email Routing"
2. 添加 DNS 记录（按提示操作）

### 3. 配置 Catch-All 规则

Email Routing → Routes → Add Route：
- 选择 "Catch-all"
- Action: "Send to a Worker"
- Worker: cloud-mail
- 保存

### 4. 配置 SPF（可选，提高送达率）

添加 TXT 记录：
- 名称: @
- 内容: v=spf1 include:_spf.mx.cloudflare.net ~all

## 使用

### Web 管理面板

配置完成后访问: https://mail.neumabio.xyz/admin

密码: `neumabio2026!`

### 创建 50 个邮箱地址

```bash
cd ~/Workspace/HermesWork/cloud-mail
ADMIN_PASSWORD=neumabio2026! npx tsx scripts/create-addresses.ts
```

预设地址包括:
- reg-01@neumabio.xyz ~ reg-30@neumabio.xyz (通用注册)
- aws@, azure@, gcp@, do@, vultr@, linode@, hetzner@ (云服务)
- cloudflare@, vercel@, netlify@ (平台)
- github@, gitlab@, docker@, npm@ (开发工具)
- openai@, anthropic@, googleai@ (AI/API)
- admin@, test@, notify@ (管理)

### API

```bash
# 查看统计
curl https://mail.neumabio.xyz/admin/api/stats \
  -H "x-admin-password: neumabio2026!"

# 列出所有地址
curl https://mail.neumabio.xyz/admin/api/addresses \
  -H "x-admin-password: neumabio2026!"

# 查看某个地址的邮件
curl "https://mail.neumabio.xyz/admin/api/emails?address=aws@neumabio.xyz" \
  -H "x-admin-password: neumabio2026!"

# 创建地址
curl -X POST https://mail.neumabio.xyz/admin/api/addresses \
  -H "x-admin-password: neumabio2026!" \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["newbox@neumabio.xyz"]}'
```

## 技术栈

| 组件 | 服务 | 成本 |
|------|------|------|
| 边缘计算 | Cloudflare Workers | 免费 (10万次/天) |
| 邮件接收 | Cloudflare Email Routing | 免费 |
| 数据库 | Cloudflare D1 | 免费 (5GB) |
| 域名 | neumabio.xyz | ~¥70/年 |

## 安全

- Admin 密码通过 `wrangler secret put ADMIN_PASSWORD` 设置
- API 需要 `x-admin-password` header
- 建议定期更换密码
