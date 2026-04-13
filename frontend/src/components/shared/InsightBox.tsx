import type { PropsWithChildren } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface InsightBoxProps {
  title: string;
  kicker: string;
}

export function InsightBox({
  title,
  kicker,
  children,
}: PropsWithChildren<InsightBoxProps>) {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(227,100,20,0.1),rgba(255,255,255,0.9))]">
      <div className="space-y-3">
        <Badge tone="accent">{kicker}</Badge>
        <h3 className="section-title text-2xl font-semibold">{title}</h3>
        <p className="text-sm leading-6 text-[var(--muted)]">{children}</p>
      </div>
    </Card>
  );
}
