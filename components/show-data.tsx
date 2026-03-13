"use client";

import { useEffect, useState } from "react";

export type UserProps = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  created_at: Date;
};
import { ColumnDef } from "@tanstack/react-table";
import DataTableDemo from "./customized/table/table-09";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
];
async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ];
}

function ShowData({ users }: { users: UserProps[] }) {
  const [data, setData] = useState<UserProps[]>();
  async function feedDatqa() {
    // const data = await getData();
    setData(data);
  }
  useEffect(() => {
    feedDatqa();
  }, []);

  console.log(users);
  return (
    <div className="p-3 h-full">
      {/* <DataTable columns={columns} data={data ?? []} /> */}
      <div className="w-full min-h-32 p-2">
        <h1 className="text-3xl">Users</h1>
      </div>
      <DataTableDemo data={users || []} />
    </div>
  );
}

export default ShowData;
