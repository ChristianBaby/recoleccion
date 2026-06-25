const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'peruandeanaventures@gmail.com'

  console.log(`Buscando usuario con email: ${email}...`)
  
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`Error: No se encontró ningún usuario con el correo ${email}`)
    process.exit(1)
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      role: 'ADMIN',
      isActive: true,
      isVerified: true
    }
  })

  console.log(`¡Éxito! El usuario ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email}) ahora tiene el rol ADMIN y está activo/verificado.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
