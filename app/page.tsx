import ShowData, { UserProps } from "@/components/show-data";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
type Props = {
  searchParams: Promise<{
    country?: string;
  }>;
};

export default async function Home({ searchParams }: Props) {
  // const props = await searchParams;

  let users: UserProps[] = [];

  try {
    users = await db.user.findMany({
      cursor: { id: 1 },
      take: 10,
    });
  } catch (error) {
    console.error("Something went wrong ", error);
  }

  return (
    <main>
      <section>
        <ShowData users={users} />
      </section>
    </main>
  );
}
