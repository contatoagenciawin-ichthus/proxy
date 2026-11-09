// Run explicitly from the Proxy environment to verify the signed CRM receiver.
import { forwardIchthusVerifiedWhatsApp } from '../lib/ichthus-whatsapp-forward-client.mjs'
const endpoint = 'https://crm.ichthusmkt.com.br/api/relationship/whatsapp/inbound'
if (process.env.ICHTHUS_WHATSAPP_CRM_ENDPOINT !== endpoint) throw Error('Unexpected CRM endpoint')
const event = {
  phoneNumberId: '107612478652254', providerMessageId: 'wamid.ichthus.g1.receiver.check.20261109',
  sender: '00000000000', kind: 'text', body: 'Teste técnico de recebimento da Ichthus', timestamp: null
}
for (let attempt = 0; attempt < 2; attempt++) {
  await forwardIchthusVerifiedWhatsApp({
    events: [event], secret: process.env.ICHTHUS_WHATSAPP_FORWARD_SECRET, endpoint,
    async fetchImpl(url, options) {
      const response = await fetch(url, {...options, signal: AbortSignal.timeout(20000)})
      if (!response.ok) throw Error('CRM receiver HTTP ' + response.status)
      const result = await response.json()
      if (result.ok !== true || ![0,1].includes(result.inserted) ||
          result.duplicates !== 1-result.inserted || (attempt === 1 && result.duplicates !== 1))
        throw Error('CRM receiver count mismatch')
      console.log('Ichthus receiver check', {inserted: result.inserted, duplicates: result.duplicates})
      return response
    }
  })
}
