import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <Card className="text-center">
      <CardContent className="pt-10 pb-10">
        {icon && <div className="mb-4 flex items-center justify-center text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>}
        {action && (
          <Button onClick={action.onClick} className="mx-auto">
            {action.label ?? t("common.actions.submit")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
