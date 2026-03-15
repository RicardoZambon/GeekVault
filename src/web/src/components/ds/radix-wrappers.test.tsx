import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
import { ScrollArea } from "./scroll-area"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./dropdown-menu"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip"

describe("Tabs", () => {
  it("renders tabs with content", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText("Tab 1")).toBeInTheDocument()
    expect(screen.getByText("Tab 2")).toBeInTheDocument()
    expect(screen.getByText("Content 1")).toBeInTheDocument()
  })

  it("renders tab triggers with correct data-state", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    // Default tab1 is active
    expect(screen.getByText("Tab 1")).toHaveAttribute("data-state", "active")
    expect(screen.getByText("Tab 2")).toHaveAttribute("data-state", "inactive")
  })
})

describe("ScrollArea", () => {
  it("renders children", () => {
    render(
      <ScrollArea>
        <div>Scrollable content</div>
      </ScrollArea>
    )
    expect(screen.getByText("Scrollable content")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <ScrollArea className="h-64">
        <div>Content</div>
      </ScrollArea>
    )
    expect(container.firstChild).toHaveClass("h-64")
  })
})

describe("DropdownMenu", () => {
  it("renders trigger", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText("Open Menu")).toBeInTheDocument()
  })

  // DropdownMenu uses Radix Portal which doesn't render in jsdom
  // Test that trigger renders and has correct aria attributes
  it("trigger has correct aria attributes when closed", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const trigger = screen.getByText("Open Menu")
    expect(trigger).toHaveAttribute("data-state", "closed")
  })
})

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Pick one")).toBeInTheDocument()
  })

  it("trigger has correct attributes", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toHaveAttribute("role", "combobox")
  })
})

describe("Tooltip", () => {
  it("renders trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })
})
