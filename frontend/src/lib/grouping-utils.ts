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
 * Get grouping breakdown for display in tables and UI
 * @param count Number of items
 * @param groupings Available grouping types
 * @returns Formatted string showing grouping breakdown (e.g., "2 boxes, 3 units")
 */
export function getGroupingBreakdown(count: number, groupings: GroupingType[]): string {
  if (count === 0) return '0';
  if (!groupings || groupings.length === 0) {
    return count.toString();
  }

  const grouping = calculateItemGrouping(count, groupings);
  
  if (grouping.groups.length === 0) {
    return `${grouping.remainingIndividualItems} unit${grouping.remainingIndividualItems !== 1 ? 's' : ''}`;
  }

  const groupsText = grouping.groups
    .map(group => `${group.completeGroups} ${group.groupName.toLowerCase()}${group.completeGroups !== 1 ? 's' : ''}`)
    .join(', ');
  
  const individualText = grouping.remainingIndividualItems > 0 
    ? `${grouping.remainingIndividualItems} unit${grouping.remainingIndividualItems !== 1 ? 's' : ''}`
    : '';

  const parts = [groupsText, individualText].filter(Boolean);
  return parts.join(', ');
}