
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI missing in .env — aborting.');
  process.exit(1);
}
const client = new MongoClient(MONGO_URI);
let col;

const MY_WA_ID = process.env.OWN_WA_ID || '918329446654';

// Connect to DB
client.connect().then(() => {
  col = client.db('whatsapp').collection('processed_messages');
  console.log('Connected to MongoDB');
});

// Helper: Always resolve to customer wa_id
function extractCustomerId(msg, value) {
  if (!msg) return undefined;
  // If 'from' is NOT me → customer
  if (msg.from && String(msg.from) !== MY_WA_ID) {
    return String(msg.from);
  }
  // Else, try 'to' or recipient_id
  if (msg.to) return String(msg.to);
  if (msg.recipient_id) return String(msg.recipient_id);
  if (value?.contacts?.[0]?.wa_id) return String(value.contacts[0].wa_id);
  return undefined;
}

// API: List chats
app.get('/api/chats', async (req, res) => {
  try {
    const previews = await col.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$wa_id',
          wa_id: { $first: '$wa_id' },
          lastText: { $first: '$text' },
          lastTime: { $first: '$timestamp' },
          status: { $first: '$status' }
        }
      },
      { $sort: { lastTime: -1 } }
    ]).toArray();
    res.json(previews);
  } catch (err) {
    console.error('GET /api/chats error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Chat history
app.get('/api/chats/:wa_id', async (req, res) => {
  try {
    const msgs = await col.find({ wa_id: req.params.wa_id }).sort({ timestamp: 1 }).toArray();
    res.json(msgs);
  } catch (err) {
    console.error('GET /api/chats/:wa_id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Send message (store only)
app.post('/api/chats/:wa_id', async (req, res) => {
  const { wa_id } = req.params;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

  const msg = {
    wa_id, // already customer id from route
    text: text.trim(),
    timestamp: Date.now(),
    status: 'sent',
    id: `local_${Date.now()}`,
    sentByMe: true,
    raw_payload: { local: true }
  };

  try {
    await col.insertOne(msg);
    res.status(201).json(msg);
  } catch (err) {
    console.error('POST /api/chats/:wa_id insert error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Webhook receiver
app.post('/api/webhook', async (req, res) => {
  const body = req.body;
  try {
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value || change;

        // Incoming/outgoing messages
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const m of messages) {
          const customerId = extractCustomerId(m, value);
          if (!customerId) continue;

          const processed = {
            wa_id: customerId,
            id: m.id || `wamid_${Date.now()}`,
            text: m.text?.body || m.body || '',
            timestamp: m.timestamp ? Number(m.timestamp) * 1000 : Date.now(),
            status: (String(m.from) === MY_WA_ID) ? 'sent' : 'received',
            sentByMe: String(m.from) === MY_WA_ID,
            raw_payload: m
          };

          const exists = await col.findOne({ id: processed.id });
          if (!exists) {
            await col.insertOne(processed);
            console.log('Inserted message', processed.id);
          }
        }

        // Status updates
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const s of statuses) {
          const msgId = s.id || s.meta_msg_id;
          if (!msgId) continue;
          await col.updateOne({ id: msgId }, { $set: { status: s.status } });
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error', err);
    res.sendStatus(500);
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Backend running on port ${port}`));
