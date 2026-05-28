import { PrismaClient, Role, ShiftStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create a Facility
  const facility = await prisma.facility.create({
    data: {
      name: "Bayside Care Home",
      address: "123 Ocean Drive, Coastal Bay",
    }
  })

  console.log(`Created facility: ${facility.name}`)

  // 2. Link the demo facility manager to this facility
  // (Assuming facility@demo.com exists from our earlier SQL script)
  await prisma.user.updateMany({
    where: { email: 'facility@demo.carelink.app' },
    data: { facilityId: facility.id }
  })

  // 3. Create some dummy shifts
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(7, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(15, 0, 0, 0)

  const friday = new Date()
  friday.setDate(friday.getDate() + 3)
  friday.setHours(23, 0, 0, 0)

  const fridayEnd = new Date(friday)
  fridayEnd.setDate(fridayEnd.getDate() + 1)
  fridayEnd.setHours(7, 0, 0, 0)

  await prisma.shift.createMany({
    data: [
      {
        facilityId: facility.id,
        role: Role.PCA,
        status: ShiftStatus.PENDING,
        startTime: tomorrow,
        endTime: tomorrowEnd,
        hourlyRate: 32.50
      },
      {
        facilityId: facility.id,
        role: Role.NURSE,
        status: ShiftStatus.PENDING,
        startTime: friday,
        endTime: fridayEnd,
        hourlyRate: 55.00
      }
    ]
  })

  console.log('Seeding complete! Added shifts.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
