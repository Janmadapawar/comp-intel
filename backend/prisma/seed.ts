import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeCompany(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const raw = [
  // FAANG
  { company: "Google", role: "Software Engineer", level: "L3", location: "Bangalore", experience_years: 1, base_salary: 2200000, bonus: 400000, stock: 800000 },
  { company: "Google", role: "Software Engineer", level: "L4", location: "Bangalore", experience_years: 3, base_salary: 3500000, bonus: 700000, stock: 1500000 },
  { company: "Google", role: "Software Engineer", level: "L5", location: "Bangalore", experience_years: 6, base_salary: 5000000, bonus: 1200000, stock: 3000000 },
  { company: "Google", role: "Software Engineer", level: "L6", location: "Hyderabad", experience_years: 10, base_salary: 7000000, bonus: 2000000, stock: 5000000 },
  { company: "Google", role: "Data Scientist", level: "L4", location: "Bangalore", experience_years: 3, base_salary: 3200000, bonus: 600000, stock: 1200000 },
  { company: "Google", role: "Data Scientist", level: "L5", location: "Hyderabad", experience_years: 6, base_salary: 4800000, bonus: 1100000, stock: 2800000 },
  { company: "Google", role: "Product Manager", level: "L5", location: "Bangalore", experience_years: 5, base_salary: 4800000, bonus: 1500000, stock: 3500000 },
  { company: "Google", role: "ML Engineer", level: "L5", location: "Bangalore", experience_years: 5, base_salary: 5200000, bonus: 1400000, stock: 3200000 },

  { company: "Microsoft", role: "Software Engineer", level: "SDE1", location: "Hyderabad", experience_years: 1, base_salary: 1800000, bonus: 250000, stock: 500000 },
  { company: "Microsoft", role: "Software Engineer", level: "SDE2", location: "Hyderabad", experience_years: 3, base_salary: 2800000, bonus: 500000, stock: 1000000 },
  { company: "Microsoft", role: "Software Engineer", level: "SDE3", location: "Bangalore", experience_years: 6, base_salary: 4200000, bonus: 900000, stock: 2000000 },
  { company: "Microsoft", role: "Senior SDE", level: "L63", location: "Hyderabad", experience_years: 8, base_salary: 5500000, bonus: 1400000, stock: 3200000 },
  { company: "Microsoft", role: "Data Scientist", level: "SDE2", location: "Hyderabad", experience_years: 4, base_salary: 2600000, bonus: 400000, stock: 900000 },
  { company: "Microsoft", role: "Product Manager", level: "L62", location: "Bangalore", experience_years: 5, base_salary: 3800000, bonus: 1000000, stock: 2000000 },

  { company: "Amazon", role: "Software Engineer", level: "SDE1", location: "Bangalore", experience_years: 1, base_salary: 1600000, bonus: 200000, stock: 600000 },
  { company: "Amazon", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 2500000, bonus: 400000, stock: 1400000 },
  { company: "Amazon", role: "Software Engineer", level: "SDE3", location: "Hyderabad", experience_years: 6, base_salary: 3800000, bonus: 800000, stock: 2500000 },
  { company: "Amazon", role: "Data Engineer", level: "SDE2", location: "Bangalore", experience_years: 4, base_salary: 2300000, bonus: 350000, stock: 1200000 },
  { company: "Amazon", role: "Product Manager", level: "L5", location: "Bangalore", experience_years: 5, base_salary: 3600000, bonus: 900000, stock: 2000000 },

  { company: "Meta", role: "Software Engineer", level: "E3", location: "Bangalore", experience_years: 1, base_salary: 2400000, bonus: 500000, stock: 1000000 },
  { company: "Meta", role: "Software Engineer", level: "E4", location: "Bangalore", experience_years: 3, base_salary: 3800000, bonus: 900000, stock: 2000000 },
  { company: "Meta", role: "Software Engineer", level: "E5", location: "Bangalore", experience_years: 6, base_salary: 5500000, bonus: 1500000, stock: 4000000 },
  { company: "Meta", role: "ML Engineer", level: "E4", location: "Bangalore", experience_years: 4, base_salary: 4200000, bonus: 1000000, stock: 2500000 },
  { company: "Meta", role: "Product Manager", level: "IC4", location: "Bangalore", experience_years: 5, base_salary: 4500000, bonus: 1300000, stock: 3000000 },

  // Indian unicorns
  { company: "Flipkart", role: "Software Engineer", level: "SDE1", location: "Bangalore", experience_years: 1, base_salary: 1400000, bonus: 150000, stock: 300000 },
  { company: "Flipkart", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 2200000, bonus: 300000, stock: 700000 },
  { company: "Flipkart", role: "Software Engineer", level: "SDE3", location: "Bangalore", experience_years: 6, base_salary: 3200000, bonus: 600000, stock: 1500000 },
  { company: "Flipkart", role: "Data Scientist", level: "L3", location: "Bangalore", experience_years: 3, base_salary: 2000000, bonus: 250000, stock: 600000 },
  { company: "Flipkart", role: "Product Manager", level: "PM2", location: "Bangalore", experience_years: 4, base_salary: 2600000, bonus: 450000, stock: 1000000 },

  { company: "Swiggy", role: "Software Engineer", level: "SDE1", location: "Bangalore", experience_years: 1, base_salary: 1300000, bonus: 100000, stock: 250000 },
  { company: "Swiggy", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 2000000, bonus: 250000, stock: 600000 },
  { company: "Swiggy", role: "Software Engineer", level: "SDE3", location: "Bangalore", experience_years: 5, base_salary: 2900000, bonus: 500000, stock: 1200000 },
  { company: "Swiggy", role: "ML Engineer", level: "L3", location: "Bangalore", experience_years: 3, base_salary: 2200000, bonus: 300000, stock: 700000 },

  { company: "Razorpay", role: "Software Engineer", level: "SDE1", location: "Bangalore", experience_years: 1, base_salary: 1500000, bonus: 150000, stock: 400000 },
  { company: "Razorpay", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 2400000, bonus: 350000, stock: 900000 },
  { company: "Razorpay", role: "Backend Engineer", level: "SDE3", location: "Bangalore", experience_years: 5, base_salary: 3400000, bonus: 700000, stock: 1800000 },

  { company: "Zepto", role: "Software Engineer", level: "SDE1", location: "Mumbai", experience_years: 1, base_salary: 1200000, bonus: 100000, stock: 300000 },
  { company: "Zepto", role: "Software Engineer", level: "SDE2", location: "Mumbai", experience_years: 3, base_salary: 1900000, bonus: 200000, stock: 700000 },
  { company: "Zepto", role: "Data Scientist", level: "L2", location: "Mumbai", experience_years: 2, base_salary: 1600000, bonus: 150000, stock: 500000 },

  { company: "Meesho", role: "Software Engineer", level: "SDE1", location: "Bangalore", experience_years: 1, base_salary: 1250000, bonus: 100000, stock: 350000 },
  { company: "Meesho", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 1950000, bonus: 220000, stock: 650000 },
  { company: "Meesho", role: "ML Engineer", level: "L3", location: "Bangalore", experience_years: 3, base_salary: 2100000, bonus: 280000, stock: 750000 },

  { company: "PhonePe", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 2200000, bonus: 300000, stock: 700000 },
  { company: "PhonePe", role: "Software Engineer", level: "SDE3", location: "Bangalore", experience_years: 5, base_salary: 3100000, bonus: 600000, stock: 1400000 },
  { company: "PhonePe", role: "Data Engineer", level: "SDE2", location: "Bangalore", experience_years: 4, base_salary: 2000000, bonus: 280000, stock: 650000 },

  { company: "Ola", role: "Software Engineer", level: "SDE2", location: "Bangalore", experience_years: 3, base_salary: 1800000, bonus: 200000, stock: 500000 },
  { company: "Ola", role: "Backend Engineer", level: "SDE3", location: "Bangalore", experience_years: 5, base_salary: 2700000, bonus: 400000, stock: 1000000 },

  { company: "Paytm", role: "Software Engineer", level: "SDE1", location: "Noida", experience_years: 1, base_salary: 1100000, bonus: 80000, stock: 200000 },
  { company: "Paytm", role: "Software Engineer", level: "SDE2", location: "Noida", experience_years: 3, base_salary: 1750000, bonus: 200000, stock: 500000 },
  { company: "Paytm", role: "Data Scientist", level: "L2", location: "Bangalore", experience_years: 3, base_salary: 1600000, bonus: 180000, stock: 450000 },

  // IT services
  { company: "Infosys", role: "Software Engineer", level: "SE", location: "Pune", experience_years: 1, base_salary: 420000, bonus: 30000, stock: 0 },
  { company: "Infosys", role: "Software Engineer", level: "SSE", location: "Bangalore", experience_years: 3, base_salary: 800000, bonus: 80000, stock: 0 },
  { company: "Infosys", role: "Tech Lead", level: "TL", location: "Hyderabad", experience_years: 6, base_salary: 1400000, bonus: 150000, stock: 0 },

  { company: "TCS", role: "Software Engineer", level: "C1", location: "Chennai", experience_years: 1, base_salary: 380000, bonus: 25000, stock: 0 },
  { company: "TCS", role: "Software Engineer", level: "C2", location: "Pune", experience_years: 3, base_salary: 700000, bonus: 60000, stock: 0 },
  { company: "TCS", role: "Tech Lead", level: "C3", location: "Bangalore", experience_years: 6, base_salary: 1200000, bonus: 120000, stock: 0 },

  { company: "Wipro", role: "Software Engineer", level: "B2", location: "Bangalore", experience_years: 1, base_salary: 400000, bonus: 30000, stock: 0 },
  { company: "Wipro", role: "Software Engineer", level: "C1", location: "Hyderabad", experience_years: 3, base_salary: 750000, bonus: 70000, stock: 0 },

  // Global product cos
  { company: "Salesforce", role: "Software Engineer", level: "MTS1", location: "Hyderabad", experience_years: 2, base_salary: 2000000, bonus: 300000, stock: 800000 },
  { company: "Salesforce", role: "Software Engineer", level: "MTS2", location: "Hyderabad", experience_years: 4, base_salary: 3200000, bonus: 600000, stock: 1500000 },

  { company: "Adobe", role: "Software Engineer", level: "L2", location: "Bangalore", experience_years: 2, base_salary: 1900000, bonus: 280000, stock: 700000 },
  { company: "Adobe", role: "Software Engineer", level: "L3", location: "Bangalore", experience_years: 5, base_salary: 3000000, bonus: 600000, stock: 1400000 },

  { company: "Atlassian", role: "Software Engineer", level: "P3", location: "Bangalore", experience_years: 3, base_salary: 2600000, bonus: 500000, stock: 1200000 },
  { company: "Atlassian", role: "Software Engineer", level: "P4", location: "Bangalore", experience_years: 6, base_salary: 4000000, bonus: 900000, stock: 2500000 },

  { company: "Uber", role: "Software Engineer", level: "L4", location: "Bangalore", experience_years: 3, base_salary: 2800000, bonus: 550000, stock: 1300000 },
  { company: "Uber", role: "Software Engineer", level: "L5", location: "Bangalore", experience_years: 6, base_salary: 4200000, bonus: 1000000, stock: 2800000 },
  { company: "Uber", role: "Data Scientist", level: "L4", location: "Bangalore", experience_years: 4, base_salary: 3000000, bonus: 600000, stock: 1400000 },
];

async function main() {
  console.log("🌱 Seeding database...");
  await prisma.salary.deleteMany();

  let count = 0;
  for (const d of raw) {
    const bonus = d.bonus ?? 0;
    const stock = d.stock ?? 0;
    await prisma.salary.create({
      data: {
        company: normalizeCompany(d.company),
        role: d.role,
        level: d.level,
        location: d.location,
        experience_years: d.experience_years,
        base_salary: d.base_salary,
        bonus,
        stock,
        total_compensation: d.base_salary + bonus + stock,
        confidence_score: 0.9,
      },
    });
    count++;
  }
  console.log(`✅ Seeded ${count} records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
