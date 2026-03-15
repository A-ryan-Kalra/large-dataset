export type UserProps = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  created_at: Date;
};

import DataTableDemo from "./customized/table/table-data";

function ShowData({ users }: { users: UserProps[] }) {
  return (
    <div className="p-3 h-full">
      <div className="w-full min-h-32 p-2">
        <h1 className="text-3xl">Users</h1>
      </div>
      <DataTableDemo userData={users || []} />
    </div>
  );
}

export default ShowData;
