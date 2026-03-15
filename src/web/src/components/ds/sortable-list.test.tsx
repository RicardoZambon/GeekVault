import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SortableList } from "./sortable-list"

describe("SortableList", () => {
  const items = [
    { id: "a", name: "Item A" },
    { id: "b", name: "Item B" },
    { id: "c", name: "Item C" },
  ]

  it("renders all items", () => {
    render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item, { dragHandleProps }) => (
          <div>
            <button {...dragHandleProps}>Drag</button>
            <span>{item.name}</span>
          </div>
        )}
        onReorder={vi.fn()}
      />
    )
    expect(screen.getByText("Item A")).toBeInTheDocument()
    expect(screen.getByText("Item B")).toBeInTheDocument()
    expect(screen.getByText("Item C")).toBeInTheDocument()
  })

  it("renders drag handles for each item", () => {
    render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item, { dragHandleProps }) => (
          <div>
            <button {...dragHandleProps}>Drag</button>
            <span>{item.name}</span>
          </div>
        )}
        onReorder={vi.fn()}
      />
    )
    expect(screen.getAllByText("Drag")).toHaveLength(3)
  })

  it("renders in vertical layout by default", () => {
    const { container } = render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <div>{item.name}</div>}
        onReorder={vi.fn()}
      />
    )
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass("flex", "flex-col")
  })

  it("renders in grid layout when specified", () => {
    const { container } = render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <div>{item.name}</div>}
        onReorder={vi.fn()}
        layout="grid"
      />
    )
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass("grid")
  })

  it("applies custom gridClassName", () => {
    const { container } = render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <div>{item.name}</div>}
        onReorder={vi.fn()}
        layout="grid"
        gridClassName="grid-cols-3 gap-2"
      />
    )
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass("grid-cols-3")
  })

  it("applies custom className", () => {
    const { container } = render(
      <SortableList
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <div>{item.name}</div>}
        onReorder={vi.fn()}
        className="my-custom"
      />
    )
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass("my-custom")
  })

  it("renders empty list without errors", () => {
    const { container } = render(
      <SortableList
        items={[]}
        keyExtractor={(item: any) => item.id}
        renderItem={(item: any) => <div>{item.name}</div>}
        onReorder={vi.fn()}
      />
    )
    expect(container).toBeTruthy()
  })
})
