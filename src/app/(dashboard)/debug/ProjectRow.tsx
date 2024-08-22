import { TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Project } from "@/types";

export function ProjectRow({ project }: { project: Project }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{project.title}</TableCell>
      <TableCell>{project.description}</TableCell>
      <TableCell>{project.hackathon}</TableCell>
      <TableCell>
        {project.sourceCode ? (
          <a
            href={project.sourceCode}
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Source
          </a>
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell>{project.howItsMade || "N/A"}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <a
                href={`https://ethglobal.com${project.link}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Project
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
