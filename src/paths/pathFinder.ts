/**
 * Path discovery module for finding transfer routes between accounts
 */

import { TransferRelationship } from '../types';

/**
 * Cache for memoizing path discovery results.
 * Key format: "sourceId->targetId"
 * Performance optimization: Avoids recalculating paths between the same account pairs.
 */
const pathCache = new Map<string, TransferRelationship[]>();

/**
 * Clears the path discovery cache.
 * Useful for testing or when the transfer matrix changes.
 */
export function clearPathCache(): void {
  pathCache.clear();
}

/**
 * Generates a cache key for a source-target pair.
 */
function getCacheKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`;
}

/**
 * Finds all paths from any source account to the target account using BFS graph traversal.
 * 
 * This function discovers both direct transfers (1 hop) and multi-hop transfers through
 * intermediate accounts. For accounts with no path to the target, an empty array is returned.
 * 
 * Performance optimization: Results are memoized to avoid recalculating paths between
 * the same account pairs.
 * 
 * @param targetAccountId - The destination account ID
 * @param transferMatrix - Array of all available transfer relationships
 * @returns Map where keys are source account IDs and values are arrays of TransferRelationship
 *          representing the path from that source to the target. Empty array if no path exists.
 * 
 * Requirements: 1.5, 2.3, 2.4, 8.3
 */
export function findAllPathsToTarget(
  targetAccountId: string,
  transferMatrix: TransferRelationship[]
): Map<string, TransferRelationship[]> {
  const result = new Map<string, TransferRelationship[]>();
  
  // Filter only available relationships
  const availableRelationships = transferMatrix.filter(rel => rel.isAvailable);
  
  // Build adjacency list for efficient graph traversal
  const adjacencyList = new Map<string, TransferRelationship[]>();
  const allAccountIds = new Set<string>();
  
  for (const rel of availableRelationships) {
    allAccountIds.add(rel.fromAccountId);
    allAccountIds.add(rel.toAccountId);
    
    if (!adjacencyList.has(rel.fromAccountId)) {
      adjacencyList.set(rel.fromAccountId, []);
    }
    adjacencyList.get(rel.fromAccountId)!.push(rel);
  }
  
  // For each potential source account, find path to target using BFS with memoization
  for (const sourceAccountId of allAccountIds) {
    if (sourceAccountId === targetAccountId) {
      // Target account has empty path to itself
      result.set(sourceAccountId, []);
      continue;
    }
    
    // Check cache first
    const cacheKey = getCacheKey(sourceAccountId, targetAccountId);
    let path: TransferRelationship[];
    
    if (pathCache.has(cacheKey)) {
      // Cache hit - reuse previously calculated path
      path = pathCache.get(cacheKey)!;
    } else {
      // Cache miss - calculate path and store in cache
      path = findPathBFS(sourceAccountId, targetAccountId, adjacencyList);
      pathCache.set(cacheKey, path);
    }
    
    result.set(sourceAccountId, path);
  }
  
  return result;
}

/**
 * Performs BFS to find the shortest path from source to target.
 * 
 * @param sourceId - Starting account ID
 * @param targetId - Destination account ID
 * @param adjacencyList - Graph representation of transfer relationships
 * @returns Array of TransferRelationship representing the path, or empty array if no path exists
 */
function findPathBFS(
  sourceId: string,
  targetId: string,
  adjacencyList: Map<string, TransferRelationship[]>
): TransferRelationship[] {
  // Queue stores: [currentAccountId, path taken so far]
  const queue: [string, TransferRelationship[]][] = [[sourceId, []]];
  const visited = new Set<string>([sourceId]);
  
  while (queue.length > 0) {
    const [currentId, currentPath] = queue.shift()!;
    
    // Get all outgoing relationships from current account
    const outgoingRels = adjacencyList.get(currentId) || [];
    
    for (const rel of outgoingRels) {
      const nextId = rel.toAccountId;
      
      // Found the target!
      if (nextId === targetId) {
        return [...currentPath, rel];
      }
      
      // Continue exploring if not visited
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push([nextId, [...currentPath, rel]]);
      }
    }
  }
  
  // No path found
  return [];
}
