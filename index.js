const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const app = express();
app.use(express.json());

// CORS - السماح للموقع بالاتصال
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://fabulous-taiyaki-91d4f6.netlify.app');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Config
const BOT_TOKEN      = process.env.BOT_TOKEN;
const GUILD_ID       = '1426599027364855959';
const CATEGORY_ID    = '1476094397501149194';
const STAFF_ROLE_ID  = '1436035759000916068';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`✅ البوت شغال: ${client.user.tag}`);
});

client.login(BOT_TOKEN);

// API - فتح تكت
app.post('/create-ticket', async (req, res) => {
  try {
    const { userId, username, items, total, gameName, notes } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);
    const category = await guild.channels.fetch(CATEGORY_ID);

    // اسم القناة
    const channelName = `ticket-${username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}`;

    // التحقق إذا فيه تكت مفتوح لنفس الشخص
    const existing = guild.channels.cache.find(c => c.name === channelName);
    if (existing) {
      return res.json({ success: true, channelId: existing.id, existed: true });
    }

    // إنشاء القناة
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: STAFF_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
        {
          id: userId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ],
    });

    // إرسال رسالة الطلب داخل القناة
    const itemsList = items.map(i => `• ${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join('\n');

    await channel.send({
      content: `<@${userId}> <@&${STAFF_ROLE_ID}>`,
      embeds: [{
        title: '🎫 طلب جديد',
        color: 0xe85d1a,
        fields: [
          { name: '👤 الاسم في اللعبة', value: gameName || 'غير محدد', inline: true },
          { name: '💬 يوزر الديسكورد',  value: `<@${userId}>`, inline: true },
          { name: '📦 المنتجات',         value: itemsList, inline: false },
          { name: '💰 المجموع الكلي',   value: `**$${parseFloat(total).toFixed(2)}**`, inline: true },
          { name: '📝 ملاحظات',          value: notes || 'لا يوجد', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Blacko Out Store' }
      }]
    });

    res.json({ success: true, channelId: channel.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => res.send('Blacko Out Bot API ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API شغال على port ${PORT}`));
