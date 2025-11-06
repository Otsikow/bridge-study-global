import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import { ArrowLeft, Clock, ChevronDown, Trash2 } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export interface BackButtonProps extends React.ComponentProps<typeof Button> {
  fallback?: string;
  label?: string;
  wrapperClassName?: string;
}

export default function BackButton({
  fallback = "/",
  label = "Back",
  className,
  wrapperClassName,
  onClick,
  variant,
  size,
  disabled,
  ...buttonProps
}: BackButtonProps) {
  const navigate = useNavigate();
  const { history, currentEntry, navigateTo, clearHistory } = useNavigationHistory();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const previousEntries = React.useMemo(() => (history.length > 1 ? history.slice(0, -1).reverse() : []), [history]);

  const hasHistory = previousEntries.length > 0;
  const immediatePrevious = hasHistory ? previousEntries[0] : null;

  const handleNavigateToEntry = React.useCallback(
    (entry: typeof previousEntries[number]) => {
      setMenuOpen(false);
      navigateTo(entry);
    },
    [navigateTo],
  );

  const handleFallbackNavigation = React.useCallback(() => {
    navigate(fallback);
  }, [fallback, navigate]);

  const handlePrimaryClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) {
        return;
      }

      if (immediatePrevious) {
        navigateTo(immediatePrevious);
        return;
      }

      handleFallbackNavigation();
    },
    [disabled, handleFallbackNavigation, immediatePrevious, navigateTo, onClick],
  );

  const handleClearHistory = React.useCallback(
    (event: Event) => {
      event.preventDefault();
      clearHistory();
      setMenuOpen(false);
    },
    [clearHistory],
  );

  const historyButtonVariant = variant;
  const historyButtonSize = size;

  return (
    <div className={cn("inline-flex items-stretch", wrapperClassName)}>
      <Button
        {...buttonProps}
        variant={variant}
        size={size}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2",
          hasHistory && "rounded-r-none",
          className,
        )}
        onClick={handlePrimaryClick}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{label}</span>
      </Button>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={historyButtonVariant}
            size={historyButtonSize}
            disabled={!hasHistory || disabled}
            className={cn(
              "px-2 shadow-none",
              hasHistory ? "rounded-l-none border-l border-border/50" : "hidden",
              size === "sm" ? "px-1" : null,
            )}
            aria-label="Show recent pages"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Current page</span>
            <span className="font-medium leading-tight">{currentEntry?.label ?? "Current"}</span>
            {currentEntry?.pathname ? (
              <span className="text-xs text-muted-foreground truncate">{currentEntry.pathname}</span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hasHistory ? (
            previousEntries.map((entry) => (
              <DropdownMenuItem
                key={entry.id}
                onSelect={(event) => {
                  event.preventDefault();
                  handleNavigateToEntry(entry);
                }}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate" title={entry.label}>
                    {entry.label}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground truncate w-full" title={`${entry.pathname}${entry.search}${entry.hash}`}>
                  {entry.pathname}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-sm text-muted-foreground">
              No recent pages
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleFallbackNavigation();
              setMenuOpen(false);
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to fallback
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleClearHistory}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
