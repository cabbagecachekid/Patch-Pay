/**
 * Property-based tests for path discovery
 * 
 * Feature: transfer-routing-algorithm, Property 5: Transfer matrix compliance
 * Feature: transfer-routing-algorithm, Property 6: Path discovery completeness
 * Validates: Requirements 2.3, 2.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { findAllPathsToTarget, clearPathCache } from './pathFinder';
import { TransferRelationship, TransferSpeed } from '../types';

describe('Path Discovery - Property Tests', () => {
  // Clear the path cache before each test to ensure test isolation
  beforeEach(() => {
    clearPathCache();
  });
  describe('Property 5: Transfer matrix compliance', () => {
    it('should only use relationships defined in the transfer matrix', () => {
      fc.assert(
        fc.property(
          // Generate a target account ID
          fc.string({ minLength: 1, maxLength: 10 }),
          // Generate a transfer matrix with available relationships
          fc.array(
            fc.record({
              fromAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              toAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              speed: fc.constantFrom(...Object.values(TransferSpeed)),
              fee: fc.option(fc.float({ min: 0, max: 50, noNaN: true }), { nil: null }),
              isAvailable: fc.boolean()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (targetAccountId: string, transferMatrix: TransferRelationship[]) => {
            const paths = findAllPathsToTarget(targetAccountId, transferMatrix);
            
            // Create a set of all available relationships for quick lookup
            const availableRelationships = new Set(
              transferMatrix
                .filter(rel => rel.isAvailable)
                .map(rel => `${rel.fromAccountId}->${rel.toAccountId}`)
            );
            
            // Check every relationship in every path
            for (const [sourceId, path] of paths.entries()) {
              for (const rel of path) {
                const relKey = `${rel.fromAccountId}->${rel.toAccountId}`;
                
                // Every relationship in the path must be in the transfer matrix
                expect(availableRelationships.has(relKey)).toBe(true);
                
                // Every relationship must be marked as available
                expect(rel.isAvailable).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use unavailable relationships in paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.array(
            fc.record({
              fromAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              toAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              speed: fc.constantFrom(...Object.values(TransferSpeed)),
              fee: fc.option(fc.float({ min: 0, max: 50, noNaN: true }), { nil: null }),
              isAvailable: fc.boolean()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (targetAccountId: string, transferMatrix: TransferRelationship[]) => {
            const paths = findAllPathsToTarget(targetAccountId, transferMatrix);
            
            // Check that no path uses an unavailable relationship
            for (const [sourceId, path] of paths.entries()) {
              for (const rel of path) {
                expect(rel.isAvailable).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Path discovery completeness', () => {
    it('should discover direct transfers (1 hop)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.constantFrom(...Object.values(TransferSpeed)),
          fc.option(fc.float({ min: 0, max: 50, noNaN: true }), { nil: null }),
          (sourceId: string, targetId: string, speed: TransferSpeed, fee: number | null) => {
            // Skip if source and target are the same
            fc.pre(sourceId !== targetId);
            
            // Create a direct transfer relationship
            const transferMatrix: TransferRelationship[] = [
              {
                fromAccountId: sourceId,
                toAccountId: targetId,
                speed,
                fee,
                isAvailable: true
              }
            ];
            
            const paths = findAllPathsToTarget(targetId, transferMatrix);
            
            // Should find a path from source to target
            expect(paths.has(sourceId)).toBe(true);
            const path = paths.get(sourceId)!;
            
            // Path should have exactly 1 hop
            expect(path.length).toBe(1);
            
            // The hop should be the direct relationship
            expect(path[0].fromAccountId).toBe(sourceId);
            expect(path[0].toAccountId).toBe(targetId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should discover multi-hop transfers', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (sourceId: string, intermediateId: string, targetId: string) => {
            // Ensure all IDs are different
            fc.pre(sourceId !== intermediateId && intermediateId !== targetId && sourceId !== targetId);
            
            // Create a 2-hop path: source -> intermediate -> target
            const transferMatrix: TransferRelationship[] = [
              {
                fromAccountId: sourceId,
                toAccountId: intermediateId,
                speed: TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              },
              {
                fromAccountId: intermediateId,
                toAccountId: targetId,
                speed: TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              }
            ];
            
            const paths = findAllPathsToTarget(targetId, transferMatrix);
            
            // Should find a path from source to target
            expect(paths.has(sourceId)).toBe(true);
            const path = paths.get(sourceId)!;
            
            // Path should have exactly 2 hops
            expect(path.length).toBe(2);
            
            // Verify the path is correct
            expect(path[0].fromAccountId).toBe(sourceId);
            expect(path[0].toAccountId).toBe(intermediateId);
            expect(path[1].fromAccountId).toBe(intermediateId);
            expect(path[1].toAccountId).toBe(targetId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty path for unreachable accounts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (sourceId: string, targetId: string, isolatedId: string, dummyId: string) => {
            // Ensure all IDs are different
            fc.pre(
              sourceId !== targetId && 
              sourceId !== isolatedId && 
              sourceId !== dummyId &&
              targetId !== isolatedId && 
              targetId !== dummyId &&
              isolatedId !== dummyId
            );
            
            // Create a transfer matrix where:
            // - source can reach target
            // - isolated has a relationship but only to a dummy account (not connected to target)
            const transferMatrix: TransferRelationship[] = [
              {
                fromAccountId: sourceId,
                toAccountId: targetId,
                speed: TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              },
              {
                // Isolated account has an outgoing relationship to a dummy account
                // that has no connection to target
                fromAccountId: isolatedId,
                toAccountId: dummyId,
                speed: TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              }
            ];
            
            const paths = findAllPathsToTarget(targetId, transferMatrix);
            
            // Source should have a path
            expect(paths.has(sourceId)).toBe(true);
            expect(paths.get(sourceId)!.length).toBeGreaterThan(0);
            
            // Isolated account is in the matrix but cannot reach target, so should have empty path
            expect(paths.has(isolatedId)).toBe(true);
            expect(paths.get(isolatedId)!).toEqual([]);
            
            // Dummy account also cannot reach target
            expect(paths.has(dummyId)).toBe(true);
            expect(paths.get(dummyId)!).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle target account having empty path to itself', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.array(
            fc.record({
              fromAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              toAccountId: fc.string({ minLength: 1, maxLength: 10 }),
              speed: fc.constantFrom(...Object.values(TransferSpeed)),
              fee: fc.option(fc.float({ min: 0, max: 50, noNaN: true }), { nil: null }),
              isAvailable: fc.boolean()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (targetAccountId: string, transferMatrix: TransferRelationship[]) => {
            const paths = findAllPathsToTarget(targetAccountId, transferMatrix);
            
            // Target account should have an empty path to itself
            if (paths.has(targetAccountId)) {
              expect(paths.get(targetAccountId)!).toEqual([]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find all accounts that can reach the target', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          (targetId: string, sourceIds: string[]) => {
            // Ensure all source IDs are different from target
            const uniqueSourceIds = [...new Set(sourceIds)].filter(id => id !== targetId);
            fc.pre(uniqueSourceIds.length > 0);
            
            // Create direct paths from all sources to target
            const transferMatrix: TransferRelationship[] = uniqueSourceIds.map(sourceId => ({
              fromAccountId: sourceId,
              toAccountId: targetId,
              speed: TransferSpeed.INSTANT,
              fee: 0,
              isAvailable: true
            }));
            
            const paths = findAllPathsToTarget(targetId, transferMatrix);
            
            // All source accounts should have paths to target
            for (const sourceId of uniqueSourceIds) {
              expect(paths.has(sourceId)).toBe(true);
              expect(paths.get(sourceId)!.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find shortest path when multiple paths exist', () => {
      // Create a specific scenario: source can reach target via direct path (1 hop)
      // or via intermediate (2 hops). BFS should find the shortest (1 hop).
      const sourceId = 'source';
      const intermediateId = 'intermediate';
      const targetId = 'target';
      
      const transferMatrix: TransferRelationship[] = [
        // Direct path (1 hop)
        {
          fromAccountId: sourceId,
          toAccountId: targetId,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        },
        // Longer path (2 hops)
        {
          fromAccountId: sourceId,
          toAccountId: intermediateId,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        },
        {
          fromAccountId: intermediateId,
          toAccountId: targetId,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        }
      ];
      
      const paths = findAllPathsToTarget(targetId, transferMatrix);
      
      // Should find the shortest path (1 hop)
      expect(paths.has(sourceId)).toBe(true);
      const path = paths.get(sourceId)!;
      expect(path.length).toBe(1);
      expect(path[0].fromAccountId).toBe(sourceId);
      expect(path[0].toAccountId).toBe(targetId);
    });

    it('should handle empty transfer matrix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (targetAccountId: string) => {
            const transferMatrix: TransferRelationship[] = [];
            
            const paths = findAllPathsToTarget(targetAccountId, transferMatrix);
            
            // Should return an empty map or only the target with empty path
            for (const [accountId, path] of paths.entries()) {
              if (accountId === targetAccountId) {
                expect(path).toEqual([]);
              } else {
                expect(path).toEqual([]);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle cycles in the transfer graph without infinite loops', () => {
      // Create a cycle: A -> B -> C -> A, with target being C
      const accountA = 'A';
      const accountB = 'B';
      const accountC = 'C';
      
      const transferMatrix: TransferRelationship[] = [
        {
          fromAccountId: accountA,
          toAccountId: accountB,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        },
        {
          fromAccountId: accountB,
          toAccountId: accountC,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        },
        {
          fromAccountId: accountC,
          toAccountId: accountA,
          speed: TransferSpeed.INSTANT,
          fee: 0,
          isAvailable: true
        }
      ];
      
      const paths = findAllPathsToTarget(accountC, transferMatrix);
      
      // Should find paths without infinite loops
      expect(paths.has(accountA)).toBe(true);
      const pathFromA = paths.get(accountA)!;
      expect(pathFromA.length).toBe(2); // A -> B -> C
      
      expect(paths.has(accountB)).toBe(true);
      const pathFromB = paths.get(accountB)!;
      expect(pathFromB.length).toBe(1); // B -> C
      
      expect(paths.has(accountC)).toBe(true);
      const pathFromC = paths.get(accountC)!;
      expect(pathFromC.length).toBe(0); // C is the target
    });
  });
});
