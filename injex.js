const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
        browser: ["NEEMSS BOT", "Chrome", "1.0"]
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('✅ NEEMSS BOT CONNECTED')
        }
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const cmd = text.toLowerCase().trim().split(' ')[0]
        const args = text.split(' ').slice(1).join(' ')

        if(cmd === '.menu' || cmd === '.help') {
            await sock.sendMessage(from, { text: `*🐉 NEEMSS BOT - 41 COMMANDS 🐉*\n\n*GENERAL:*\n.menu.ping.owner.info.runtime\n\n*FUN:*\n.joke.quote.fact.8ball\n\n*TOOLS:*\n.sticker.tagall.hidetag\n\n*ROAST:*\n.dini.zamel.fuck.kill.slap.hug.kiss.love\n\nType.ping to test!\nPowered by Neemss` })
        }
        else if(cmd === '.ping') {
            await sock.sendMessage(from, { text: '🏓 Pong! 42ms\n🐉 NEEMSS BOT Active' })
        }
        else if(cmd === '.owner') {
            await sock.sendMessage(from, { text: '👑 Owner: Neemss\n🐉 NEEMSS BOT' })
        }
        else if(cmd === '.tagall') {
            if(from.endsWith('@g.us')) {
                const group = await sock.groupMetadata(from)
                const members = group.participants.map(p => p.id)
                let txt = `*📢 TAGALL:*\n${args || 'Attention!'}\n\n`
                members.forEach(id => txt += `@${id.split('@')[0]} `)
                await sock.sendMessage(from, { text: txt, mentions: members })
            }
        }
        else if(cmd.startsWith('.')) {
            await sock.sendMessage(from, { text: `✅ Command ${cmd} received! [${args}] - NEEMSS BOT 🐉` })
        }
    })
}
startBot()
