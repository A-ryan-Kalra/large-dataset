"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export type UserProps = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  created_at: Date;
};

import DataTableDemo from "./customized/table/table-data";
import StatusTableDemo from "./customized/table/status-table";
import { ExportType } from "@/app/page";

function ShowData({
  users,
  exportJob,
}: {
  users: UserProps[];
  exportJob: ExportType[];
}) {
  return (
    <div className="p-3 h-full">
      <div className="w-full min-h-32 p-2">
        <h1 className="text-3xl">Users Dataset</h1>
      </div>

      <Tabs defaultValue="users" className="w-full h-full">
        <TabsList>
          <TabsTrigger value="users">Home</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <DataTableDemo userData={users || []} />
        </TabsContent>
        <TabsContent value="status">
          <StatusTableDemo exportJob={exportJob || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ShowData;
