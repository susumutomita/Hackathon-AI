import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Table components", () => {
  test("should export all table components", async () => {
    const tableModule = await import("../table");

    expect(tableModule.Table).toBeDefined();
    expect(tableModule.TableHeader).toBeDefined();
    expect(tableModule.TableBody).toBeDefined();
    expect(tableModule.TableFooter).toBeDefined();
    expect(tableModule.TableRow).toBeDefined();
    expect(tableModule.TableHead).toBeDefined();
    expect(tableModule.TableCell).toBeDefined();
    expect(tableModule.TableCaption).toBeDefined();

    // All are forwardRef components
    expect(typeof tableModule.Table).toBe("object");
    expect(typeof tableModule.TableHeader).toBe("object");
    expect(typeof tableModule.TableBody).toBe("object");
    expect(typeof tableModule.TableFooter).toBe("object");
    expect(typeof tableModule.TableRow).toBe("object");
    expect(typeof tableModule.TableHead).toBe("object");
    expect(typeof tableModule.TableCell).toBe("object");
    expect(typeof tableModule.TableCaption).toBe("object");
  });

  describe("Table component", () => {
    test("should render with wrapper div and table", async () => {
      const { Table } = await import("../table");

      const component = React.createElement(Table, {}, "Table content");

      const html = renderToString(component);
      expect(html).toContain("Table content");
      expect(html).toContain("<div");
      expect(html).toContain("<table");
      expect(html).toContain("relative w-full overflow-auto");
      expect(html).toContain("w-full caption-bottom text-sm");
    });

    test("should merge custom className", async () => {
      const { Table } = await import("../table");

      const component = React.createElement(
        Table,
        {
          className: "custom-table",
        },
        "Content",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-table");
      expect(html).toContain("w-full caption-bottom text-sm");
    });

    test("should have correct displayName", async () => {
      const { Table } = await import("../table");
      expect(Table.displayName).toBe("Table");
    });
  });

  describe("TableHeader component", () => {
    test("should render thead element", async () => {
      const { TableHeader } = await import("../table");

      const component = React.createElement(TableHeader, {}, "Header content");

      const html = renderToString(component);
      expect(html).toContain("<thead");
      expect(html).toContain("Header content");
      expect(html).toContain("[&amp;_tr]:border-b");
    });

    test("should merge custom className", async () => {
      const { TableHeader } = await import("../table");

      const component = React.createElement(
        TableHeader,
        {
          className: "custom-header",
        },
        "Header",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-header");
      expect(html).toContain("[&amp;_tr]:border-b");
    });

    test("should have correct displayName", async () => {
      const { TableHeader } = await import("../table");
      expect(TableHeader.displayName).toBe("TableHeader");
    });
  });

  describe("TableBody component", () => {
    test("should render tbody element", async () => {
      const { TableBody } = await import("../table");

      const component = React.createElement(TableBody, {}, "Body content");

      const html = renderToString(component);
      expect(html).toContain("<tbody");
      expect(html).toContain("Body content");
      expect(html).toContain("[&amp;_tr:last-child]:border-0");
    });

    test("should merge custom className", async () => {
      const { TableBody } = await import("../table");

      const component = React.createElement(
        TableBody,
        {
          className: "custom-body",
        },
        "Body",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-body");
      expect(html).toContain("[&amp;_tr:last-child]:border-0");
    });

    test("should have correct displayName", async () => {
      const { TableBody } = await import("../table");
      expect(TableBody.displayName).toBe("TableBody");
    });
  });

  describe("TableFooter component", () => {
    test("should render tfoot element", async () => {
      const { TableFooter } = await import("../table");

      const component = React.createElement(TableFooter, {}, "Footer content");

      const html = renderToString(component);
      expect(html).toContain("<tfoot");
      expect(html).toContain("Footer content");
      expect(html).toContain("border-t bg-muted/50 font-medium");
    });

    test("should merge custom className", async () => {
      const { TableFooter } = await import("../table");

      const component = React.createElement(
        TableFooter,
        {
          className: "custom-footer",
        },
        "Footer",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-footer");
      expect(html).toContain("border-t bg-muted/50");
    });

    test("should have correct displayName", async () => {
      const { TableFooter } = await import("../table");
      expect(TableFooter.displayName).toBe("TableFooter");
    });
  });

  describe("TableRow component", () => {
    test("should render tr element", async () => {
      const { TableRow } = await import("../table");

      const component = React.createElement(TableRow, {}, "Row content");

      const html = renderToString(component);
      expect(html).toContain("<tr");
      expect(html).toContain("Row content");
      expect(html).toContain("border-b transition-colors hover:bg-muted/50");
    });

    test("should merge custom className", async () => {
      const { TableRow } = await import("../table");

      const component = React.createElement(
        TableRow,
        {
          className: "custom-row",
        },
        "Row",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-row");
      expect(html).toContain("border-b transition-colors");
    });

    test("should have correct displayName", async () => {
      const { TableRow } = await import("../table");
      expect(TableRow.displayName).toBe("TableRow");
    });
  });

  describe("TableHead component", () => {
    test("should render th element", async () => {
      const { TableHead } = await import("../table");

      const component = React.createElement(TableHead, {}, "Head content");

      const html = renderToString(component);
      expect(html).toContain("<th");
      expect(html).toContain("Head content");
      expect(html).toContain("h-12 px-4 text-left align-middle font-medium");
    });

    test("should merge custom className", async () => {
      const { TableHead } = await import("../table");

      const component = React.createElement(
        TableHead,
        {
          className: "custom-head",
        },
        "Head",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-head");
      expect(html).toContain("h-12 px-4 text-left");
    });

    test("should have correct displayName", async () => {
      const { TableHead } = await import("../table");
      expect(TableHead.displayName).toBe("TableHead");
    });
  });

  describe("TableCell component", () => {
    test("should render td element", async () => {
      const { TableCell } = await import("../table");

      const component = React.createElement(TableCell, {}, "Cell content");

      const html = renderToString(component);
      expect(html).toContain("<td");
      expect(html).toContain("Cell content");
      expect(html).toContain("p-4 align-middle");
    });

    test("should merge custom className", async () => {
      const { TableCell } = await import("../table");

      const component = React.createElement(
        TableCell,
        {
          className: "custom-cell",
        },
        "Cell",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-cell");
      expect(html).toContain("p-4 align-middle");
    });

    test("should have correct displayName", async () => {
      const { TableCell } = await import("../table");
      expect(TableCell.displayName).toBe("TableCell");
    });
  });

  describe("TableCaption component", () => {
    test("should render caption element", async () => {
      const { TableCaption } = await import("../table");

      const component = React.createElement(
        TableCaption,
        {},
        "Caption content",
      );

      const html = renderToString(component);
      expect(html).toContain("<caption");
      expect(html).toContain("Caption content");
      expect(html).toContain("mt-4 text-sm text-muted-foreground");
    });

    test("should merge custom className", async () => {
      const { TableCaption } = await import("../table");

      const component = React.createElement(
        TableCaption,
        {
          className: "custom-caption",
        },
        "Caption",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-caption");
      expect(html).toContain("mt-4 text-sm");
    });

    test("should have correct displayName", async () => {
      const { TableCaption } = await import("../table");
      expect(TableCaption.displayName).toBe("TableCaption");
    });
  });

  describe("Integration test", () => {
    test("should compose a complete table", async () => {
      const table = await import("../table");
      const {
        Table,
        TableHeader,
        TableBody,
        TableFooter,
        TableRow,
        TableHead,
        TableCell,
        TableCaption,
      } = table;

      const tableComponent = React.createElement(Table, {}, [
        React.createElement(
          TableCaption,
          {
            key: "caption",
          },
          "A list of recent invoices.",
        ),
        React.createElement(
          TableHeader,
          {
            key: "header",
          },
          React.createElement(TableRow, {}, [
            React.createElement(
              TableHead,
              {
                key: "invoice",
              },
              "Invoice",
            ),
            React.createElement(
              TableHead,
              {
                key: "status",
              },
              "Status",
            ),
            React.createElement(
              TableHead,
              {
                key: "method",
              },
              "Method",
            ),
            React.createElement(
              TableHead,
              {
                key: "amount",
                className: "text-right",
              },
              "Amount",
            ),
          ]),
        ),
        React.createElement(
          TableBody,
          {
            key: "body",
          },
          [
            React.createElement(
              TableRow,
              {
                key: "row1",
              },
              [
                React.createElement(
                  TableCell,
                  {
                    key: "inv001",
                    className: "font-medium",
                  },
                  "INV001",
                ),
                React.createElement(
                  TableCell,
                  {
                    key: "paid",
                  },
                  "Paid",
                ),
                React.createElement(
                  TableCell,
                  {
                    key: "credit",
                  },
                  "Credit Card",
                ),
                React.createElement(
                  TableCell,
                  {
                    key: "amount",
                    className: "text-right",
                  },
                  "$250.00",
                ),
              ],
            ),
          ],
        ),
        React.createElement(
          TableFooter,
          {
            key: "footer",
          },
          React.createElement(TableRow, {}, [
            React.createElement(
              TableCell,
              {
                key: "total-label",
                colSpan: 3,
              },
              "Total",
            ),
            React.createElement(
              TableCell,
              {
                key: "total-amount",
                className: "text-right",
              },
              "$250.00",
            ),
          ]),
        ),
      ]);

      expect(tableComponent.type).toBe(Table);
      expect(tableComponent.props.children).toHaveLength(4);

      // Render the component to increase coverage
      const html = renderToString(tableComponent);
      expect(html).toContain("A list of recent invoices.");
      expect(html).toContain("Invoice");
      expect(html).toContain("Status");
      expect(html).toContain("Method");
      expect(html).toContain("Amount");
      expect(html).toContain("INV001");
      expect(html).toContain("Paid");
      expect(html).toContain("Credit Card");
      expect(html).toContain("$250.00");
      expect(html).toContain("Total");
    });
  });
});
