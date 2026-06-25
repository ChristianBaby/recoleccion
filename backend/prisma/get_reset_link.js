const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'peruandeanaventures@gmail.com'
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      passwordResetToken: true,
      firstName: true
    }
  })

  if (!user || !user.passwordResetToken) {
    console.log(`No hay un token de recuperación activo para ${email}.`)
    return
  }

  const link = `http://localhost:3000/reset-password?token=${user.passwordResetToken}`
  console.log(`\n🔑 ENLACE DE RECUPERACIÓN DIRECTO PARA ${user.firstName}:`)
  console.log(link)
  console.log('')
}

main().catch(console.error).finally(() => prisma.$disconnect())
