import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { TopToolbar } from "./top-toolbar"
import { CommandPalette } from "./command-palette"
import { AnimatedOutlet } from "./animated-outlet"

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <Header />

        {/* Desktop top toolbar */}
        <TopToolbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <AnimatedOutlet />
        </main>
      </div>

      {/* Command palette (Cmd+K) */}
      <CommandPalette />
    </div>
  )
}
