"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { getGroupingBreakdown } from "@/lib/grouping-utils";

export interface QuantitySubItem {
  id: string;
  quantityType: "individual" | "group";
  quantity: string; // For individual items
  groupQuantity: string; // Number of groups
  groupName: string; // Selected group name for group type
}

interface QuantitySelectorProps {
  subItems: QuantitySubItem[];
  availableGroupings: { groupName: string; unitsPerGroup: number }[];
  onAddSubItem: (type: "individual" | "group", groupName?: string) => void;
  onRemoveSubItem: (id: string) => void;
  onUpdateSubItem: (id: string, updates: Partial<QuantitySubItem>) => void;
  className?: string;
}

export function QuantitySelector({
  subItems,
  availableGroupings,
  onAddSubItem,
  onRemoveSubItem,
  onUpdateSubItem,
  className = "",
}: QuantitySelectorProps) {
  return (
    <div className={className}>
      {/* Sub-Items List */}
      {subItems.length > 0 && (
        <div className="space-y-3">
          {subItems.map((subItem) => (
            <div
              key={subItem.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
            >
              <div className="flex-1">
                {subItem.quantityType === "individual" ? (
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium min-w-[100px]">
                      Unit:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={subItem.quantity}
                      onChange={(e) =>
                        onUpdateSubItem(subItem.id, {
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium min-w-[100px]">
                      {subItem.groupName}:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Groups"
                      value={subItem.groupQuantity}
                      onChange={(e) =>
                        onUpdateSubItem(subItem.id, {
                          groupQuantity: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSubItem(subItem.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Sub-item Buttons */}
      <div className="mt-3 pt-3 border-t space-y-2">
        <Label className="text-sm font-medium">Add quantity type:</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSubItem("individual")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Unit
          </Button>
          {availableGroupings.map((group) => (
            <Button
              key={group.groupName}
              variant="outline"
              size="sm"
              onClick={() => onAddSubItem("group", group.groupName)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {group.groupName}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate total items (for backend operations)
export function calculateTotalQuantity(
  subItems: QuantitySubItem[],
  availableGroupings: { groupName: string; unitsPerGroup: number }[]
): number {
  return subItems.reduce((total, subItem) => {
    if (subItem.quantityType === "individual") {
      return total + (parseInt(subItem.quantity) || 0);
    } else if (subItem.quantityType === "group" && subItem.groupName) {
      const grouping = availableGroupings.find(
        (g) => g.groupName === subItem.groupName
      );
      const groupQty = parseInt(subItem.groupQuantity) || 0;
      return total + (grouping ? groupQty * grouping.unitsPerGroup : 0);
    }
    return total;
  }, 0);
}

// Helper function to get grouping breakdown for display
export function getTotalGroupingBreakdown(
  subItems: QuantitySubItem[],
  availableGroupings: { groupName: string; unitsPerGroup: number }[]
): string {
  const totalCount = calculateTotalQuantity(subItems, availableGroupings);
  return getGroupingBreakdown(totalCount, availableGroupings);
}
