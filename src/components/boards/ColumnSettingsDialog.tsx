"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLUMN_COLORS = [
  null,
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const COLUMN_ICONS = [
  null,
  "circle",
  "star",
  "flag",
  "zap",
  "target",
  "clock",
  "check-circle",
  "alert-circle",
];

interface ColumnSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: { id: string; name: string; color: string | null; icon: string | null };
  onSave: (data: { name: string; color: string | null; icon: string | null }) => void;
  isLoading?: boolean;
}

export function ColumnSettingsDialog({
  open,
  onOpenChange,
  column,
  onSave,
  isLoading,
}: ColumnSettingsDialogProps) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState<string | null>(column.color);
  const [icon, setIcon] = useState<string | null>(column.icon);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Column name"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c ?? "none"}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c ?? "transparent",
                    ...(c === null
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)",
                          backgroundSize: "8px 8px",
                        }
                      : {}),
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_ICONS.map((ic) => (
                <button
                  key={ic ?? "none"}
                  type="button"
                  className={`h-8 w-8 rounded-md border text-xs flex items-center justify-center transition-colors ${
                    icon === ic
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setIcon(ic)}
                >
                  {ic ? ic.slice(0, 2) : "\u2014"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
