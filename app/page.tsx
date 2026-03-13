import ShowData from "@/components/show-data";
import { db } from "@/lib/db";

type Props = {
  searchParams: Promise<{
    country?: string;
  }>;
};

export default async function Home({ searchParams }: Props) {
  const props = await searchParams;

  console.log(props);

  const users = await db.user.findMany({
    where: {
      country: { equals: props?.country, mode: "insensitive" },
    },
    take: 1000,
  });

  return (
    <main>
      <section>
        <ShowData users={users} />
      </section>
    </main>
  );
}
