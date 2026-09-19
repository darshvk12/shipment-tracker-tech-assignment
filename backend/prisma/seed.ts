import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORIGINS = ["New York, USA", "Shanghai, China", "London, UK", "Mumbai, India", "Dubai, UAE", "Tokyo, Japan", "Hamburg, Germany"];
const DESTINATIONS = ["Los Angeles, USA", "Singapore", "Rotterdam, Netherlands", "Sydney, Australia", "Cape Town, South Africa", "Sao Paulo, Brazil", "Mumbai, India"];
const STATUSES = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "RETURN_DUE_TO_CUSTOMER", "DELIVERED"];

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Clearing old shipments...');
  await prisma.statusHistory.deleteMany();
  await prisma.shipment.deleteMany();

  console.log('Generating realistic mock data...');
  const shipmentsData = [];
  const today = new Date();
  
  // Generate 50 shipments
  for (let i = 1; i <= 50; i++) {
    const isPast = Math.random() > 0.5; // 50% past/delivered, 50% future
    const expectedDelivery = isPast 
      ? getRandomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today) // Past 30 days
      : getRandomDate(today, new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)); // Next 14 days

    let status = isPast ? "DELIVERED" : getRandomItem(STATUSES.filter(s => s !== "DELIVERED"));
    
    // Create some specific upcoming deliveries for the "Next 3 Days" widget
    if (i > 45) {
      status = "IN_TRANSIT";
      expectedDelivery.setTime(today.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000)); // 0-2 days from now
    }

    const creationDate = getRandomDate(new Date(expectedDelivery.getTime() - 14 * 24 * 60 * 60 * 1000), expectedDelivery);

    shipmentsData.push({
      referenceNumber: `NGK-${2026}-${String(i).padStart(4, '0')}`,
      origin: getRandomItem(ORIGINS),
      destination: getRandomItem(DESTINATIONS),
      currentStatus: status,
      expectedDeliveryDate: expectedDelivery,
      createdAt: creationDate,
      updatedAt: new Date(),
    });
  }

  // Insert sequentially to ensure timeline history makes sense
  let count = 0;
  for (const data of shipmentsData) {
    const shipment = await prisma.shipment.create({
      data: {
        ...data,
        statusHistory: {
          create: [
            {
              status: "BOOKED",
              note: "Shipment booked and confirmed.",
              changedAt: data.createdAt
            },
            ...(data.currentStatus !== "BOOKED" ? [{
              status: data.currentStatus,
              note: `Status updated to ${data.currentStatus}`,
              changedAt: data.updatedAt
            }] : [])
          ]
        }
      }
    });
    count++;
  }

  console.log(`✅ Successfully seeded ${count} shipments into the database!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
