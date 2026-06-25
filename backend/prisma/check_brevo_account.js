require('dotenv').config()

async function checkAccount() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('Error: BREVO_API_KEY no está definida en .env')
    return
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('Status Account:', res.status)
    const body = await res.json()
    console.log('Account Details:', JSON.stringify(body, null, 2))
    
    // Consultar remitentes verificados
    const resSenders = await fetch('https://api.brevo.com/v3/senders', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    console.log('Status Senders:', resSenders.status)
    const sendersBody = await resSenders.json()
    console.log('Senders Details:', JSON.stringify(sendersBody, null, 2))

  } catch (error) {
    console.error('Error de red:', error)
  }
}

checkAccount()
