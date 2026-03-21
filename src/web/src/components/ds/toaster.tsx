import { Toaster as SonnerToaster, toast } from "sonner"

function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={4000}
      className="!z-[100]"
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-card-foreground border border-border shadow-lg rounded-lg",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          success:
            "!bg-success/10 !border-success/30 !text-success-foreground",
          error:
            "!bg-destructive/10 !border-destructive/30 !text-destructive",
          info: "!bg-primary/10 !border-primary/30 !text-primary",
          warning: "!bg-accent/10 !border-accent/30 !text-accent-foreground",
        },
      }}
    />
  )
}

export { Toaster, toast }
