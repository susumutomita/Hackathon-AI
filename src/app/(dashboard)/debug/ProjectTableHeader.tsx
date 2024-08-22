import { TableHeader, TableRow, TableHead } from "@/components/ui/table";

export function ProjectTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Hackathon</TableHead>
        <TableHead>Source Code</TableHead>
        <TableHead>How it’s Made</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
