import "dotenv/config";
import { db } from "@/lib/db";

async function seedDataAtOnce() {
  try {
    const count = await db.user.count();

    if (count > 0) {
      console.log("Databse already seeded");
      return;
    }
    console.log("count=", count);
    console.log("Starting seed....");

    await db.$executeRawUnsafe(`
            INSERT INTO "user" ("first_name","last_name","email","country")
            SELECT
                'Test' || g as first_name,
                'User' || g as last_name,
                'test.user' || g || '@gmail.com' as email,
                CASE
                    WHEN g % 3=0 THEN 'INDIA'
                    WHEN g % 3=1 THEN 'USA'
                    ELSE 'GERMANY'
                    END AS country
            from generate_series(1,1000000) as g;
            `);

    console.log("Seed completed");
  } catch (error) {
    console.log("Seeding failed: ", error);
  } finally {
    await db.$disconnect();
  }
}

seedDataAtOnce();
