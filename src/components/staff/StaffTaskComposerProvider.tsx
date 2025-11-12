import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import StaffTaskComposer from "@/components/staff/StaffTaskComposer";
import { Button, type ButtonProps } from "@/components/ui/button";

interface StaffTaskComposerContextValue {
  openComposer: () => void;
  closeComposer: () => void;
}

const StaffTaskComposerContext = createContext<StaffTaskComposerContextValue | null>(null);

export interface StaffTaskComposerProviderProps {
  children: ReactNode;
}

export function StaffTaskComposerProvider({ children }: StaffTaskComposerProviderProps) {
  const [open, setOpen] = useState(false);

  const openComposer = useCallback(() => {
    setOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      openComposer,
      closeComposer,
    }),
    [openComposer, closeComposer],
  );

  return (
    <StaffTaskComposerContext.Provider value={contextValue}>
      {children}
      <StaffTaskComposer open={open} onOpenChange={setOpen} hideTrigger />
    </StaffTaskComposerContext.Provider>
  );
}

export const useStaffTaskComposer = () => {
  const context = useContext(StaffTaskComposerContext);
  if (!context) {
    throw new Error("useStaffTaskComposer must be used within a StaffTaskComposerProvider");
  }
  return context;
};

export interface StaffTaskComposerButtonProps extends ButtonProps {
  label?: string;
  icon?: ReactNode;
}

export function StaffTaskComposerButton({
  label = "Add task",
  icon = <Plus className="h-4 w-4" />,
  onClick,
  children,
  className,
  ...buttonProps
}: StaffTaskComposerButtonProps) {
  const { openComposer } = useStaffTaskComposer();

  const handleClick: NonNullable<ButtonProps["onClick"]> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      openComposer();
    }
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      className={className ?? "w-full justify-center gap-2 sm:w-auto"}
      size={buttonProps.size ?? "sm"}
    >
      {children ?? (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}

export default StaffTaskComposerProvider;
