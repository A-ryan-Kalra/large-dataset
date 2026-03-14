import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PageSize = {
  defaultData: string;
  setDefaultData: (num: string) => void;
  values: string[];
};
function ListData({ defaultData, setDefaultData, values }: PageSize) {
  return (
    <Select
      // value={defaultData}
      onValueChange={(e) => {
        setDefaultData(e);
      }}
    >
      <SelectTrigger className="">
        <SelectValue placeholder={defaultData} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values.map((val, idx) => (
            <SelectItem key={idx} value={val}>
              {val}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default ListData;
