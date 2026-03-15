import ShowData, { UserProps } from "@/components/show-data";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { status } from "@prisma/client";

type Props = {
  searchParams: Promise<{
    country?: string;
  }>;
};
export type ExportType = {
  id: number;
  last_exported_id: number | null;
  status: status;
  created_at: Date;
};

export default async function Home({ searchParams }: Props) {
  // const props = await searchParams;

  let users: UserProps[] = [];
  let exportJob: ExportType[] = [];

  try {
    users = await db.user.findMany({
      cursor: { id: 1 },
      take: 10,
    });
    exportJob = await db.export_job.findMany({
      select: {
        id: true,
        last_exported_id: true,
        status: true,
        created_at: true,
      },
      take: 10,
      orderBy: {
        created_at: "desc",
      },
    });
  } catch (error) {
    console.error("Something went wrong ", error);
  }

  return (
    <main>
      <section>
        <ShowData users={users} exportJob={exportJob} />
      </section>
    </main>
  );
}
