import nodemailer from 'nodemailer'
import { env } from '../config/env'

const smtpReady = !!(env.smtp.user && env.smtp.pass)

function createTransport() {
  if (!smtpReady) {
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

const transport = createTransport()

async function sendMail(to: string, subject: string, html: string) {
  const info = await transport.sendMail({ from: env.smtp.from, to, subject, html })

  if (!smtpReady) {
    const parsed = JSON.parse((info as unknown as { message: string }).message)
    console.log('\n📧 EMAIL (modo consola — configura SMTP_PASS para envío real):')
    console.log(`   Para: ${parsed.to[0].address}`)
    console.log(`   Asunto: ${parsed.subject}`)
    const linkMatch = (parsed.html as string).match(/href="([^"]+)"/)
    if (linkMatch) console.log(`   ✅ Link: ${linkMatch[1]}`)
    console.log('')
  }
}

export async function sendVerificationEmail(to: string, firstName: string, token: string) {
  const link = `${env.frontendUrl}/verify-email?token=${token}`
  await sendMail(
    to,
    'Confirma tu cuenta — EcoRutas Cusco',
    verificationTemplate(firstName, link),
  )
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const link = `${env.frontendUrl}/reset-password?token=${token}`
  await sendMail(
    to,
    'Recupera tu contraseña — EcoRutas Cusco',
    resetPasswordTemplate(firstName, link),
  )
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoRutas Cusco</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🌿 EcoRutas Cusco</h1>
              <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Sistema de Gestión de Residuos Sólidos</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                Municipalidad del Cusco — Sistema Inteligente de Recolección de Residuos<br>
                Si no solicitaste esto, ignora este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function verificationTemplate(firstName: string, link: string): string {
  return baseTemplate(`
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">¡Hola, ${firstName}! 👋</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
      Gracias por registrarte en <strong>EcoRutas Cusco</strong>. Para activar tu cuenta y
      empezar a consultar los horarios de recolección de tu zona, confirma tu correo electrónico.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#16a34a;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
        ✅ Confirmar mi cuenta
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Este enlace expira en <strong>24 horas</strong>.<br>
      Si el botón no funciona, copia este link:<br>
      <a href="${link}" style="color:#16a34a;word-break:break-all;">${link}</a>
    </p>
  `)
}

function resetPasswordTemplate(firstName: string, link: string): string {
  return baseTemplate(`
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Recupera tu contraseña 🔐</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
      Hola <strong>${firstName}</strong>, recibimos una solicitud para restablecer la contraseña
      de tu cuenta en EcoRutas Cusco.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#16a34a;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
        🔑 Restablecer contraseña
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Este enlace expira en <strong>1 hora</strong>.<br>
      Si no solicitaste esto, ignora este correo — tu contraseña no cambiará.
    </p>
  `)
}
