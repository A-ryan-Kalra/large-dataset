import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PageSize = {
  pageSize: number;
  setPageSize: (num: string) => void;
};
function PageSize({ pageSize, setPageSize }: PageSize) {
  return (
    <Select
      value={pageSize.toString()}
      onValueChange={(e) => {
        setPageSize(e);
      }}
    >
      <SelectTrigger className="">
        <SelectValue placeholder="10" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="1000">1000</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default PageSize;
