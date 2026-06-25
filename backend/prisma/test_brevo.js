require('dotenv').config()

async function test() {
  const apiKey = process.env.BREVO_API_KEY
  const emailFrom = process.env.EMAIL_FROM
  const to = 'peruandeanaventures@gmail.com'

  console.log('Probando envío de correo con Brevo...')
  console.log('API KEY:', apiKey ? 'Configurada' : 'NO CONFIGURADA')
  console.log('Remitente:', emailFrom)
  
  if (!apiKey) {
    console.error('Error: BREVO_API_KEY no está definida en el archivo .env')
    return
  }

  const senderName = 'Municipalidad de Poroy'
  const senderEmail = 'noreply@poroy.gob.pe'

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: 'Prueba de Conexión de Brevo',
        htmlContent: '<h3>¡Hola! Esto es una prueba de envío desde el Sistema de Recolección local de Poroy.</h3>',
      }),
    })

    console.log('Status Code:', res.status)
    const body = await res.json()
    console.log('Response Body:', JSON.stringify(body, null, 2))
  } catch (error) {
    console.error('Error de red al conectar con Brevo:', error)
  }
}

test()
