import prisma from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  console.log("Seeding database...");

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

  // ─── Seed Admin ───────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@12345", saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bakeryhub.com" },
    update: {},
    create: {
      email: "admin@bakeryhub.com",
      password: adminPassword,
      displayName: "Admin BakeryHub",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`✅ Admin: ${admin.email}`);

  let rotiManis = await prisma.category.findFirst({ where: { name: "Roti Manis" } });
  if (!rotiManis) {
    rotiManis = await prisma.category.create({
      data: { name: "Roti Manis", description: "Berbagai varian roti manis", isActive: true },
    });
  }

  let kue = await prisma.category.findFirst({ where: { name: "Kue & Pastry" } });
  if (!kue) {
    kue = await prisma.category.create({
      data: { name: "Kue & Pastry", description: "Kue lapis, croissant, dan pastry lainnya", isActive: true },
    });
  }

  let rotiGurih = await prisma.category.findFirst({ where: { name: "Roti Gurih" } });
  if (!rotiGurih) {
    rotiGurih = await prisma.category.create({
      data: { name: "Roti Gurih", description: "Roti gurih seperti sosis, abon, dan keju", isActive: true },
    });
  }

  console.log(`✅ Kategori: ${rotiManis.name}, ${kue.name}, ${rotiGurih.name}`);

  // ─── Seed Products ────────────────────────────────────────
  const productsToSeed = [
    {
      name: "Roti Coklat Premium",
      description: "Roti manis isi coklat premium lumer di mulut.",
      price: 15000,
      stock: 50,
      categoryId: rotiManis.id,
      categoryName: rotiManis.name,
      weight: 100,
      unit: "pcs",
      isAvailable: true,
      rating: 4.8,
      totalReviews: 124,
      imageUrl: "",
      images: [],
    },
    {
      name: "Roti Keju Susu",
      description: "Roti manis dengan parutan keju melimpah dan susu kental manis.",
      price: 18000,
      stock: 45,
      categoryId: rotiManis.id,
      categoryName: rotiManis.name,
      weight: 110,
      unit: "pcs",
      isAvailable: true,
      rating: 4.7,
      totalReviews: 89,
      imageUrl: "",
      images: [],
    },
    {
      name: "Roti Sosis Mayo",
      description: "Roti gurih dengan topping sosis sapi pilihan dan saus mayo.",
      price: 16000,
      stock: 30,
      categoryId: rotiGurih.id,
      categoryName: rotiGurih.name,
      weight: 120,
      unit: "pcs",
      isAvailable: true,
      rating: 4.9,
      totalReviews: 210,
      imageUrl: "",
      images: [],
    },
    {
      name: "Roti Abon Sapi",
      description: "Roti lembut dengan taburan abon sapi asli yang melimpah.",
      price: 20000,
      stock: 25,
      categoryId: rotiGurih.id,
      categoryName: rotiGurih.name,
      weight: 105,
      unit: "pcs",
      isAvailable: true,
      rating: 4.9,
      totalReviews: 156,
      imageUrl: "",
      images: [],
    },
    {
      name: "Croissant Butter",
      description: "Croissant lapis butter asli bergaya perancis, renyah di luar.",
      price: 25000,
      stock: 40,
      categoryId: kue.id,
      categoryName: kue.name,
      weight: 80,
      unit: "pcs",
      isAvailable: true,
      rating: 4.6,
      totalReviews: 65,
      imageUrl: "",
      images: [],
    },
    {
      name: "Almond Croissant",
      description: "Croissant dengan isian almond krim dan taburan kacang almond panggang.",
      price: 32000,
      stock: 20,
      categoryId: kue.id,
      categoryName: kue.name,
      weight: 95,
      unit: "pcs",
      isAvailable: true,
      rating: 4.8,
      totalReviews: 112,
      imageUrl: "",
      images: [],
    },
    {
      name: "Choco Lava Cake",
      description: "Kue coklat yang lembut dengan isian coklat lumer saat dibelah.",
      price: 35000,
      stock: 15,
      categoryId: kue.id,
      categoryName: kue.name,
      weight: 150,
      unit: "pcs",
      isAvailable: true,
      rating: 5.0,
      totalReviews: 340,
      imageUrl: "",
      images: [],
    },
    {
      name: "Tiramisu Slice Cake",
      description: "Potongan kue tiramisu klasik dengan cita rasa kopi premium.",
      price: 40000,
      stock: 10,
      categoryId: kue.id,
      categoryName: kue.name,
      weight: 120,
      unit: "slice",
      isAvailable: true,
      rating: 4.7,
      totalReviews: 78,
      imageUrl: "",
      images: [],
    },
    {
      name: "Roti Sobek Pandan",
      description: "Roti sobek keluarga dengan aroma pandan wangi dan isian srikaya.",
      price: 28000,
      stock: 20,
      categoryId: rotiManis.id,
      categoryName: rotiManis.name,
      weight: 350,
      unit: "loaf",
      isAvailable: true,
      rating: 4.8,
      totalReviews: 190,
      imageUrl: "",
      images: [],
    },
    {
      name: "Garlic Bread Cream Cheese",
      description: "Roti panggang bawang putih korea dengan isian cream cheese manis gurih.",
      price: 30000,
      stock: 35,
      categoryId: rotiGurih.id,
      categoryName: rotiGurih.name,
      weight: 180,
      unit: "pcs",
      isAvailable: true,
      rating: 4.9,
      totalReviews: 275,
      imageUrl: "",
      images: [],
    },
  ];

  for (const p of productsToSeed) {
    const existingProduct = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existingProduct) {
      await prisma.product.create({ data: p });
    }
  }

  console.log("✅ Produk berhasil di-seed");
  console.log("");
  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
