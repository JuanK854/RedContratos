import Zavu from '@zavudev/sdk'

const apiKey = process.env.ZAVU_API_KEY
const to = process.env.ZAVU_TELEGRAM_TO ?? '+526141408579'
const senderId = process.env.ZAVU_SENDER_ID

if (!apiKey) {
  console.error('❌ Falta ZAVU_API_KEY en el entorno')
  process.exit(1)
}

if (!senderId) {
  console.error('❌ Falta ZAVU_SENDER_ID en el entorno')
  process.exit(1)
}

console.log(`📤 Enviando mensaje de prueba a ${to} por Telegram...`)

const zavu = new Zavu({
  apiKey,
  defaultHeaders: { 'Zavu-Sender': senderId },
})

const message = await zavu.messages.send({
  to,
  channel: 'telegram',
  text: '🧪 Prueba RedContratos — Zavu Telegram funcionando correctamente!',
})

console.log('✅ Respuesta de Zavu:', message)
