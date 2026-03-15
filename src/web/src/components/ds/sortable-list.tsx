import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

export interface SortableListProps<T> {
  items: T[]
  renderItem: (item: T, options: { dragHandleProps: Record<string, unknown>; isDragging: boolean }) => React.ReactNode
  onReorder: (newOrder: T[]) => void
  keyExtractor: (item: T) => string | number
  layout?: "vertical" | "grid"
  gridClassName?: string
  className?: string
}

interface SortableItemProps {
  id: string | number
  children: (options: { dragHandleProps: Record<string, unknown>; isDragging: boolean }) => React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    /* v8 ignore next */
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  }

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        /* v8 ignore next */
        isDragging && "opacity-80 shadow-lg scale-[1.02] rounded-lg"
      )}
    >
      {children({ dragHandleProps, isDragging })}
    </div>
  )
}

function SortableListInner<T>(
  {
    items,
    renderItem,
    onReorder,
    keyExtractor,
    layout = "vertical",
    gridClassName,
    className,
  }: SortableListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const itemIds = React.useMemo(
    () => items.map((item) => keyExtractor(item)),
    [items, keyExtractor]
  )

  /* v8 ignore start -- dnd-kit drag events cannot be simulated in jsdom */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = itemIds.indexOf(active.id as string | number)
    const newIndex = itemIds.indexOf(over.id as string | number)

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }
  /* v8 ignore stop */

  const strategy = layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div
          ref={ref}
          className={cn(
            layout === "grid" && (gridClassName ?? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"),
            layout === "vertical" && "flex flex-col gap-2",
            className
          )}
        >
          {items.map((item) => {
            const key = keyExtractor(item)
            return (
              <SortableItem key={key} id={key}>
                {(options) => renderItem(item, options)}
              </SortableItem>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

const SortableList = React.forwardRef(SortableListInner) as <T>(
  props: SortableListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null

export { SortableList }
