// 邮件解析器 — 从 Cloudflare EmailMessage 提取正文
import { EmailMessage } from 'cloudflare:email';
import PostalMime from 'postal-mime';

export interface ParsedEmail {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  rawEmail: string;
}

export async function parseEmail(message: EmailMessage): Promise<ParsedEmail> {
  // 获取原始邮件流
  const rawStream = message.raw;
  const chunks: Uint8Array[] = [];

  // 读取所有 chunks
  const reader = rawStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  reader.releaseLock();

  // 拼接完整的原始邮件
  const rawBytes = concatUint8Arrays(chunks);
  const rawEmail = new TextDecoder().decode(rawBytes);

  // 使用 postal-mime 解析
  let subject = '';
  let bodyText = '';
  let bodyHtml = '';

  try {
    const parser = new PostalMime();
    const parsed = await parser.parse(rawBytes);

    subject = parsed.subject || '';
    bodyText = parsed.text || '';
    bodyHtml = parsed.html || '';
  } catch (e) {
    console.warn('postal-mime 解析失败，使用基础解析:', e);
    // 基础回退解析
    subject = extractHeader(rawEmail, 'Subject') || '';
    bodyText = extractPlainText(rawEmail);
  }

  return { subject, bodyText, bodyHtml, rawEmail };
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function extractHeader(raw: string, name: string): string {
  const re = new RegExp(`^${name}:\\s*(.+)$`, 'im');
  const match = raw.match(re);
  if (!match) return '';
  return decodeMimeHeader(match[1].trim());
}

function decodeMimeHeader(value: string): string {
  // 简单处理 =?UTF-8?B?...?= 编码
  try {
    return value.replace(/=\?UTF-8\?B\?(.+?)\?=/gi, (_, b64) => {
      try {
        return atob(b64);
      } catch {
        return b64;
      }
    });
  } catch {
    return value;
  }
}

function extractPlainText(raw: string): string {
  // 简单提取 text/plain 部分
  const boundaryMatch = raw.match(/boundary="?([^"\s]+)"?/);
  if (!boundaryMatch) {
    // 无 MIME boundary，直接尝试去 HTML tag
    return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // 返回原文让用户自行查阅
  return raw.substring(0, 5000);
}
