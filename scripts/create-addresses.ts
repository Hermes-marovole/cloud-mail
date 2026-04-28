// 批量生成邮箱地址脚本
// 用法: npx tsx scripts/create-addresses.ts [数量]
// 默认生成 50 个地址

const DOMAIN = 'neumabio.xyz';
const WORKER_URL = 'https://mail.neumabio.xyz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const BATCHES = [
  // 通用注册类 (reg-01 ~ reg-30)
  ...Array.from({ length: 30 }, (_, i) => ({
    address: `reg-${String(i + 1).padStart(2, '0')}@${DOMAIN}`,
    label: '通用注册',
    notes: `批量注册邮箱 #${i + 1}`
  })),
  // 云服务类
  { address: `aws@${DOMAIN}`, label: 'AWS', notes: 'AWS 账号注册' },
  { address: `azure@${DOMAIN}`, label: 'Azure', notes: 'Microsoft Azure' },
  { address: `gcp@${DOMAIN}`, label: 'GCP', notes: 'Google Cloud Platform' },
  { address: `do@${DOMAIN}`, label: 'DigitalOcean', notes: 'DigitalOcean' },
  { address: `vultr@${DOMAIN}`, label: 'Vultr', notes: 'Vultr VPS' },
  { address: `linode@${DOMAIN}`, label: 'Linode', notes: 'Linode VPS' },
  { address: `hetzner@${DOMAIN}`, label: 'Hetzner', notes: 'Hetzner Cloud' },
  { address: `cloudflare@${DOMAIN}`, label: 'Cloudflare', notes: 'Cloudflare 账号' },
  { address: `vercel@${DOMAIN}`, label: 'Vercel', notes: 'Vercel 部署' },
  { address: `netlify@${DOMAIN}`, label: 'Netlify', notes: 'Netlify' },
  // 开发工具类
  { address: `github@${DOMAIN}`, label: 'GitHub', notes: 'GitHub 账号' },
  { address: `gitlab@${DOMAIN}`, label: 'GitLab', notes: 'GitLab' },
  { address: `docker@${DOMAIN}`, label: 'Docker', notes: 'Docker Hub' },
  { address: `npm@${DOMAIN}`, label: 'NPM', notes: 'npm 注册' },
  // AI/API 类
  { address: `openai@${DOMAIN}`, label: 'OpenAI', notes: 'OpenAI API' },
  { address: `anthropic@${DOMAIN}`, label: 'Anthropic', notes: 'Claude API' },
  { address: `googleai@${DOMAIN}`, label: 'Google AI', notes: 'Gemini API' },
  // 其他
  { address: `admin@${DOMAIN}`, label: '管理员', notes: 'Admin mailbox' },
  { address: `test@${DOMAIN}`, label: '测试', notes: '测试邮箱' },
  { address: `notify@${DOMAIN}`, label: '通知', notes: '系统通知' },
];

async function main() {
  const count = parseInt(process.argv[2]) || 50;
  const addresses = BATCHES.slice(0, count);

  console.log(`\n📧 正在创建 ${addresses.length} 个邮箱地址...\n`);

  // 分组批量发送 (每次 10 个)
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }

  let created = 0;
  for (const [idx, batch] of batches.entries()) {
    const batchAddresses = batch.map(a => a.address);
    
    try {
      const resp = await fetch(`${WORKER_URL}/admin/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD,
        },
        body: JSON.stringify({ addresses: batchAddresses }),
      });

      if (resp.ok) {
        created += batch.length;
        const emoji = '✅';
        console.log(`  ${emoji} 批次 ${idx + 1}/${batches.length}: ${batch.length} 个地址已创建`);
      } else {
        const err = await resp.json().catch(() => ({}));
        console.log(`  ❌ 批次 ${idx + 1}: ${err.error || '创建失败'}`);
      }
    } catch (e: any) {
      console.log(`  ❌ 批次 ${idx + 1}: ${e.message}`);
    }

    // 避免速率限制
    if (idx < batches.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n✨ 完成! 成功创建 ${created}/${addresses.length} 个地址\n`);
  console.log('地址列表:');
  addresses.forEach(a => console.log(`  ${a.address}  [${a.label}]`));
  console.log(`\n管理面板: ${WORKER_URL}/admin\n`);
}

main().catch(console.error);
