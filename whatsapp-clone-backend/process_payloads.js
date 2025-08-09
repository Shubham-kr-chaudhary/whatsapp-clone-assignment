
import fs from 'fs/promises';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI missing in .env — aborting.');
  process.exit(1);
}
const client = new MongoClient(MONGO_URI);

const payloadDir = path.join(__dirname, 'payloads');
const processedDir = path.join(payloadDir, 'processed');

const MY_WA_ID = process.env.OWN_WA_ID || '918329446654';

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeMessage(m, value) {
  if (!isObject(m)) return null;

  // Always resolve to customer id
  let wa_id;
  if (m.from && String(m.from) !== MY_WA_ID) {
    wa_id = m.from;
  } else if (m.to) {
    wa_id = m.to;
  } else if (value?.contacts?.[0]?.wa_id) {
    wa_id = value.contacts[0].wa_id;
  }

  const id = m.id || m.message_id;
  if (!id || !wa_id) return null;

  const text =
    typeof m.text === 'string'
      ? m.text
      : m.text?.body || m.body || '';

  const ts = m.timestamp
    ? (Number(m.timestamp) > 1e12 ? Number(m.timestamp) : Number(m.timestamp) * 1000)
    : Date.now();

  return {
    id: String(id),
    wa_id: String(wa_id),
    text: String(text),
    timestamp: ts,
    status: m.status || (String(m.from) === MY_WA_ID ? 'sent' : 'received'),
    raw_payload: m
  };
}

function normalizeStatus(s) {
  if (!isObject(s)) return null;
  const id = s.id || s.meta_msg_id;
  if (!id || !s.status) return null;
  return { id: String(id), status: s.status };
}

async function main() {
  await fs.mkdir(processedDir, { recursive: true });
  await client.connect();
  const col = client.db('whatsapp').collection('processed_messages');

  const files = (await fs.readdir(payloadDir)).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(payloadDir, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);

    const entries = data.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const msgs = value.messages || [];
        for (const m of msgs) {
          const nm = normalizeMessage(m, value);
          if (!nm) continue;
          const exists = await col.findOne({ id: nm.id });
          if (!exists) await col.insertOne(nm);
        }
        const statuses = value.statuses || [];
        for (const s of statuses) {
          const ns = normalizeStatus(s);
          if (!ns) continue;
          await col.updateOne({ id: ns.id }, { $set: { status: ns.status } });
        }
      }
    }
    await fs.rename(filePath, path.join(processedDir, file));
  }
  console.log('Processing done.');
  await client.close();
}

main().catch(e => console.error(e));
