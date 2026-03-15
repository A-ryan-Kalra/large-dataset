"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, Download } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ListData from "./list-data";
import { ExportType } from "@/app/page";

export const columns: ColumnDef<ExportType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Job Id",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("id") ?? "NA"}</div>
    ),
  },
  {
    accessorKey: "last_exported_id",
    header: "Last Processed Job Id",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("last_exported_id") ?? "NA"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },

  {
    accessorKey: "created_at",
    header: () => <div className="">Created At</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string);

      return (
        <div className="font-medium">
          {date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="">Download</div>,
    cell: ({ row }) => {
      const jobId = row.getValue("id");
      return (
        <div className="font-medium">
          {row.getValue("status") === "COMPLETE" ? (
            <Button
              onClick={() => {
                window.location.href = `/api/export-download/${jobId}`;
              }}
              variant={"secondary"}
              className="cursor-pointer"
            >
              <Download />
            </Button>
          ) : (
            "NA"
          )}
        </div>
      );
    },
  },

  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const payment = row.original;

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button className="h-8 w-8 p-0" variant="ghost">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem
  //           // onClick={() => navigator.clipboard.writeText(payment.id)}
  //           >
  //             Copy payment ID
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem>View customer</DropdownMenuItem>
  //           <DropdownMenuItem>View payment details</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];
let DEFAULT_PAGE_SIZE: number = 10;
let DEFAULT_DIRECTION = "next";

export default function StatusTableDemo({
  exportJob,
}: {
  exportJob: ExportType[];
}) {
  const [data, setData] = React.useState<ExportType[]>(exportJob);
  const [nextCursor, setNextCursor] = React.useState<number>(1);

  const [cursorStack, setCursorStack] = React.useState<number[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [jobId, setJobId] = React.useState<number>(0);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [loadingCsv, setLoadingCsv] = React.useState<boolean>(false);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    // initialState: {
    //   pagination: {
    //     pageSize: pageSize,
    //   },
    // },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      // pagination: {
      //   pageIndex,
      //   pageSize,
      // },
    },
  });

  async function gethExportedJobStatus(
    cursor: number,
    pageSize = 10,
    move = "next",
  ) {
    DEFAULT_DIRECTION = move;
    try {
      const res = await fetch(
        `/api/export-job?cursor=${cursor ?? ""}&size=${pageSize}&move=${move}`,
      );
      const data = await res.json();

      setData(data?.data);
      setNextCursor(data?.nextCursor);
    } catch (error) {
      console.error("Error something went wrong", error);
    }
  }

  const prevPage = () => {
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop();
    setCursorStack(newStack);

    gethExportedJobStatus(prevCursor as number, DEFAULT_PAGE_SIZE, "prev");
  };

  const nextPage = () => {
    setCursorStack((prev) => [...prev, nextCursor]);

    gethExportedJobStatus(nextCursor, DEFAULT_PAGE_SIZE, "next");
  };

  React.useEffect(() => {
    setNextCursor(data[data.length - 1]?.id);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <div className="flex flex-col gap-y-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="ml-auto" variant="outline">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column, idx) => {
                  return (
                    <DropdownMenuCheckboxItem
                      checked={column.getIsVisible()}
                      className="capitalize"
                      key={column.id + idx}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* React Suspense */}
      <React.Suspense fallback={"Loading..."}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup, idx) => (
                <TableRow key={headerGroup.id + idx}>
                  {headerGroup.headers.map((header, idx) => {
                    return (
                      <TableHead key={header.id + idx}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id + idx}
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <TableCell key={cell.id + idx}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </React.Suspense>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="space-x-2 flex">
          <ListData
            values={["10", "100", "1000"]}
            defaultData={DEFAULT_PAGE_SIZE.toString()}
            setDefaultData={(e: string) => {
              DEFAULT_PAGE_SIZE = Number(e);
              // setPageSize(Number(e));
              gethExportedJobStatus(data[0].id, DEFAULT_PAGE_SIZE, "pageSize");
            }}
          />

          <Button
            // disabled={!table.getCanPreviousPage()}
            disabled={cursorStack.length === 0}
            onClick={prevPage}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>

          <Button
            // disabled={!table.getCanNextPage()}
            disabled={!!!nextCursor}
            onClick={nextPage}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
