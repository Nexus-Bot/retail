// Types for grouping
export interface GroupingType {
  groupName: string;
  unitsPerGroup: number;
}

export interface GroupBreakdown {
  groupName: string;
  unitsPerGroup: number;
  completeGroups: number;
  unitsUsed: number;
}

export interface ItemGrouping {
  groups: GroupBreakdown[];
  remainingIndividualItems: number;
  totalItems: number;
}

/**
 * Calculate how items break down into groups (e.g., boxes, packs)
 * @param totalItems Total number of individual items
 * @param groupings Available grouping types (e.g., box of 12, pack of 6)
 * @returns Breakdown showing complete groups and remaining individual items
 */
export function calculateItemGrouping(
  totalItems: number,
  groupings: GroupingType[]
): ItemGrouping {
  if (!groupings || groupings.length === 0 || totalItems === 0) {
    return {
      groups: [],
      remainingIndividualItems: totalItems,
      totalItems
    };
  }

  // Sort groupings by unitsPerGroup in descending order (largest groups first)
  const sortedGroupings = [...groupings].sort((a, b) => b.unitsPerGroup - a.unitsPerGroup);
  
  let remainingItems = totalItems;
  const groupBreakdown: GroupBreakdown[] = [];

  // Calculate breakdown starting from largest group
  sortedGroupings.forEach(group => {
    if (remainingItems >= group.unitsPerGroup) {
      const completeGroups = Math.floor(remainingItems / group.unitsPerGroup);
      const unitsUsed = completeGroups * group.unitsPerGroup;
      
      if (completeGroups > 0) {
        groupBreakdown.push({
          groupName: group.groupName,
          unitsPerGroup: group.unitsPerGroup,
          completeGroups,
          unitsUsed
        });
        
        remainingItems -= unitsUsed;
      }
    }
  });

  return {
    groups: groupBreakdown,
    remainingIndividualItems: remainingItems,
    totalItems
  };
}

/**
 * Format grouping breakdown for display (e.g., "2 Boxes + 3 items")
 * @param grouping Item grouping breakdown
 * @returns Formatted string showing groups and individual items
 */
export function formatGroupingDisplay(grouping: ItemGrouping): string {
  if (grouping.totalItems === 0) return "0 items";
  
  const parts: string[] = [];
  
  // Add group parts
  grouping.groups.forEach(group => {
    if (group.completeGroups > 0) {
      parts.push(`${group.completeGroups} ${group.groupName}${group.completeGroups > 1 ? 's' : ''}`);
    }
  });
  
  // Add remaining individual items
  if (grouping.remainingIndividualItems > 0) {
    parts.push(`${grouping.remainingIndividualItems} item${grouping.remainingIndividualItems > 1 ? 's' : ''}`);
  }
  
  return parts.join(' + ');
}

/**
 * Format compact grouping display for table cells (e.g., "2B + 3")
 * @param grouping Item grouping breakdown  
 * @returns Compact formatted string for table display
 */
export function formatCompactGroupingDisplay(grouping: ItemGrouping): string {
  if (grouping.totalItems === 0) return "0";
  
  const parts: string[] = [];
  
  // Add group parts (abbreviated)
  grouping.groups.forEach(group => {
    if (group.completeGroups > 0) {
      // Use first letter of group name as abbreviation
      const abbrev = group.groupName.charAt(0).toUpperCase();
      parts.push(`${group.completeGroups}${abbrev}`);
    }
  });
  
  // Add remaining individual items
  if (grouping.remainingIndividualItems > 0) {
    parts.push(`${grouping.remainingIndividualItems}`);
  }
  
  return parts.join(' + ');
}

/**
 * Get tooltip text explaining the grouping breakdown
 * @param grouping Item grouping breakdown
 * @returns Detailed tooltip text
 */
export function getGroupingTooltip(grouping: ItemGrouping): string {
  if (grouping.totalItems === 0) return "No items";
  
  const details: string[] = [];
  
  grouping.groups.forEach(group => {
    if (group.completeGroups > 0) {
      details.push(
        `${group.completeGroups} ${group.groupName}${group.completeGroups > 1 ? 's' : ''} (${group.unitsUsed} items)`
      );
    }
  });
  
  if (grouping.remainingIndividualItems > 0) {
    details.push(`${grouping.remainingIndividualItems} individual item${grouping.remainingIndividualItems > 1 ? 's' : ''}`);
  }
  
  return `Total: ${grouping.totalItems} items\n${details.join('\n')}`;
}