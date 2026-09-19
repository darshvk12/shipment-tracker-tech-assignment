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
  
  // Generate 10 shipments
  for (let i = 1; i <= 10; i++) {
    const isPast = Math.random() > 0.5; // 50% past/delivered, 50% future
    const expectedDelivery = isPast 
      ? getRandomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today) // Past 30 days
      : getRandomDate(today, new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)); // Next 14 days

    let status = isPast ? "DELIVERED" : getRandomItem(STATUSES.filter(s => s !== "DELIVERED"));
    
    // Create some specific upcoming deliveries for the "Next 3 Days" widget
    if (i > 8) {
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
      updatedAt: new Date(), // This will be the date of the FINAL status update
    });
  }

  // Insert sequentially to ensure timeline history makes sense
  let count = 0;
  for (const data of shipmentsData) {
    // Build the history array based on the currentStatus
    const history = [];
    const timeSpan = data.updatedAt.getTime() - data.createdAt.getTime();
    
    // 1. Always start with BOOKED
    history.push({
      status: "BOOKED",
      note: "Shipment booked and confirmed.",
      changedAt: data.createdAt
    });

    const statusOrder = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
    let targetIndex = statusOrder.indexOf(data.currentStatus);
    
    // If it's a return, we will simulate the flow up to OUT_FOR_DELIVERY, then add the return.
    if (data.currentStatus === "RETURN_DUE_TO_CUSTOMER") {
        targetIndex = 2; // Treat it as OUT_FOR_DELIVERY first
    }

    // Add intermediate standard statuses
    for (let i = 1; i <= targetIndex; i++) {
        const intermediateStatus = statusOrder[i];
        // Distribute the timestamps evenly between createdAt and updatedAt
        const stepTime = data.createdAt.getTime() + (timeSpan * (i / Math.max(targetIndex, 1)));
        
        history.push({
            status: intermediateStatus,
            note: `Status updated to ${intermediateStatus.replace(/_/g, ' ')}`,
            changedAt: i === targetIndex && data.currentStatus !== "RETURN_DUE_TO_CUSTOMER" ? data.updatedAt : new Date(stepTime)
        });
    }

    // Add the final return status if applicable
    if (data.currentStatus === "RETURN_DUE_TO_CUSTOMER") {
        history.push({
            status: "RETURN_DUE_TO_CUSTOMER",
            note: "Delivery attempted but customer was unavailable.",
            changedAt: data.updatedAt
        });
    }

    const shipment = await prisma.shipment.create({
      data: {
        ...data,
        statusHistory: {
          create: history
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
