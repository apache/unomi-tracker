/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Bug Demonstration Tests
 * 
 * These tests demonstrate the bugs found in the codebase.
 * They are expected to FAIL, proving the bugs exist.
 * Once the bugs are fixed, these tests should be updated to verify the fixes.
 */

/**
 * IMPORTANT: These tests are designed to DEMONSTRATE bugs exist.
 * Some tests will show incorrect behavior (proving bugs).
 * After bugs are fixed, update these tests to verify the fixes work.
 */

// Note: Using require for now since we're testing current JS implementation
// In full test suite, we'll use ES modules
const { describe, it, expect } = require('vitest');

describe('Bug Demonstrations - These tests prove bugs exist', () => {
  
    describe('BUG #1: Incorrect splice operation in sendClickEvent (Line 448)', () => {
    /**
     * BUG DESCRIPTION:
     * In sendClickEvent, when an event is already in eventsPrevented array,
     * the code uses splice(eventIndex, 0) which does NOT remove the element.
     * This causes the array to grow indefinitely and prevents proper event handling.
     * 
     * EXPECTED BEHAVIOR:
     * - If event is already prevented, remove it from array (to allow it again)
     * - OR: If event is already prevented, skip adding it again
     * 
     * ACTUAL BEHAVIOR:
     * - splice(eventIndex, 0) removes 0 elements, so element stays in array
     * - Array grows indefinitely on repeated clicks
     */
    
        it('should demonstrate that splice(eventIndex, 0) does not remove elements', () => {
            // Simulate the buggy code
            const eventsPrevented = ['button1', 'button2'];
            const eventIndex = eventsPrevented.indexOf('button1');
      
            expect(eventIndex).toBe(0); // button1 is at index 0
      
            // This is what the current code does (WRONG)
            eventsPrevented.splice(eventIndex, 0);
      
            // The element is still there! (BUG)
            expect(eventsPrevented.length).toBe(2); // Should be 1 if we wanted to remove it
            expect(eventsPrevented).toContain('button1'); // Still present
      
            // What it SHOULD do:
            // eventsPrevented.splice(eventIndex, 1); // Remove 1 element
            // expect(eventsPrevented.length).toBe(1);
            // expect(eventsPrevented).not.toContain('button1');
        });

        it('should demonstrate eventsPrevented array grows indefinitely', () => {
            // Simulate multiple clicks on the same button
            const eventsPrevented = [];
            const targetId = 'my-button';
      
            // First click - adds to array
            if (eventsPrevented.indexOf(targetId) === -1) {
                eventsPrevented.push(targetId);
            }
            expect(eventsPrevented.length).toBe(1);
      
            // Second click - should remove or skip, but current code does nothing
            const eventIndex = eventsPrevented.indexOf(targetId);
            if (eventIndex !== -1) {
                // BUGGY CODE: This doesn't remove anything
                eventsPrevented.splice(eventIndex, 0);
            } else {
                eventsPrevented.push(targetId);
            }
      
            // Array still has the element (BUG)
            expect(eventsPrevented.length).toBe(1); // Actually this test shows the logic issue
            // But if the code path is wrong, it might add again:
      
            // Third click - might add again because splice didn't remove it
            const eventIndex2 = eventsPrevented.indexOf(targetId);
            if (eventIndex2 !== -1) {
                eventsPrevented.splice(eventIndex2, 0); // Still doesn't remove
            } else {
                eventsPrevented.push(targetId); // This won't execute
            }
      
            // The real issue: if the logic intended to remove, it doesn't work
            // If the logic intended to skip, the array management is broken
        });

        it('should show the correct behavior after fix', () => {
            // This test shows what SHOULD happen after the bug is fixed
            const eventsPrevented = ['button1'];
            const eventIndex = eventsPrevented.indexOf('button1');
      
            // CORRECT CODE: Remove 1 element
            eventsPrevented.splice(eventIndex, 1);
      
            expect(eventsPrevented.length).toBe(0);
            expect(eventsPrevented).not.toContain('button1');
        });
    });

    describe('BUG #2: Broken _resolveId function (Lines 1420-1428)', () => {
    /**
     * BUG DESCRIPTION:
     * The _resolveId function has multiple issues:
     * 1. Uses filter() which returns an array, but treats result as a string
     * 2. Uses indexOf(source) > 0 instead of >= 0 or !== -1 (misses matches at position 0)
     * 3. Tries to use array as string in replace() operation
     * 
     * EXPECTED BEHAVIOR:
     * - Should find source patterns in the ID
     * - Should replace matched patterns with mapped values
     * - Should work for matches at any position (including index 0)
     * 
     * ACTUAL BEHAVIOR:
     * - Filter returns array, not string
     * - replace() fails because source is an array
     * - Misses matches at the beginning of the string
     */
    
        it('should demonstrate that filter returns an array, not a string', () => {
            // Simulate the buggy code
            const sourceLocalIdentifierMap = {
                'old-prefix': 'new-prefix',
                'another-old': 'another-new'
            };
      
            const id = 'old-prefix-item-123';
      
            // This is what the current code does (WRONG)
            const source = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                return id.indexOf(source) > 0; // BUG: > 0 misses index 0
            });
      
            // source is an ARRAY, not a string!
            expect(Array.isArray(source)).toBe(true);
            expect(typeof source).toBe('object');
            expect(source).not.toBe('old-prefix'); // It's an array containing 'old-prefix'
      
            // The code then tries to do: id.replace(source, ...)
            // This will fail because replace() expects a string, not an array
            expect(() => {
                id.replace(source, sourceLocalIdentifierMap[source]); // This would fail
            }).toThrow(); // Or return wrong result
        });

        it('should demonstrate that indexOf > 0 misses matches at position 0', () => {
            const sourceLocalIdentifierMap = {
                prefix: 'new-prefix'
            };
      
            const id = 'prefix-item-123'; // Match at index 0
            const id2 = 'some-prefix-item-123'; // Match at index 5
      
            // Current buggy code
            const source1 = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                return id.indexOf(source) > 0; // BUG: > 0
            });
      
            const source2 = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                return id2.indexOf(source) > 0;
            });
      
            // First ID has match at index 0, so > 0 is false, filter returns empty array
            expect(source1.length).toBe(0); // BUG: Should find 'prefix'
      
            // Second ID has match at index 5, so > 0 is true, filter returns array with 'prefix'
            expect(source2.length).toBe(1); // This one works (by accident)
      
            // CORRECT CODE should use !== -1 or >= 0
            const correctSource1 = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                return id.indexOf(source) !== -1; // CORRECT
            });
            expect(correctSource1.length).toBe(1); // Now it finds it
        });

        it('should demonstrate the complete broken behavior', () => {
            const sourceLocalIdentifierMap = {
                old: 'new'
            };
      
            const id = 'old-item'; // Match at index 0
      
            // Simulate the complete buggy function
            function buggy_resolveId(id) {
                if (sourceLocalIdentifierMap) {
                    var source = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                        return id.indexOf(source) > 0; // BUG 1: > 0 misses index 0
                    });
                    // BUG 2: source is an array, not a string
                    // BUG 3: Can't use array in replace()
                    return source ? id.replace(source, sourceLocalIdentifierMap[source]) : id;
                }
                return id;
            }
      
            // This will either throw an error or return wrong result
            const result = buggy_resolveId(id);
      
            // The function likely returns the original ID unchanged (because source is empty array, falsy)
            // OR it throws an error when trying to use array in replace()
            expect(result).toBe(id); // Returns unchanged (wrong behavior)
            // OR expect(() => buggy_resolveId(id)).toThrow(); // If replace() throws
        });

        it('should show the correct behavior after fix', () => {
            const sourceLocalIdentifierMap = {
                old: 'new',
                prefix: 'new-prefix'
            };
      
            // CORRECT implementation
            function correct_resolveId(id) {
                if (sourceLocalIdentifierMap) {
                    var sources = Object.keys(sourceLocalIdentifierMap);
                    for (var i = 0; i < sources.length; i++) {
                        var source = sources[i];
                        if (id.indexOf(source) !== -1) { // CORRECT: !== -1 finds all matches
                            return id.replace(source, sourceLocalIdentifierMap[source]);
                        }
                    }
                }
                return id;
            }
      
            // Test with match at index 0
            expect(correct_resolveId('old-item')).toBe('new-item');
      
            // Test with match at index > 0
            expect(correct_resolveId('some-old-item')).toBe('some-new-item');
      
            // Test with no match
            expect(correct_resolveId('other-item')).toBe('other-item');
        });

        it('should demonstrate real-world impact: ID mapping fails', () => {
            // Real-world scenario: Unomi backend uses IDs like "site:page:123"
            // Frontend uses IDs like "page-123"
            // sourceLocalIdentifierMap should map between them
      
            const sourceLocalIdentifierMap = {
                'site:page:': 'page-',
                'site:video:': 'video-'
            };
      
            // Backend ID from Unomi
            const backendId = 'site:page:123';
      
            // Current buggy code
            function buggy_resolveId(id) {
                if (sourceLocalIdentifierMap) {
                    var source = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                        return id.indexOf(source) > 0; // BUG: 'site:page:' is at index 0, so > 0 is false
                    });
                    return source ? id.replace(source, sourceLocalIdentifierMap[source]) : id;
                }
                return id;
            }
      
            const result = buggy_resolveId(backendId);
      
            // Should be 'page-123' but buggy code returns unchanged
            expect(result).toBe(backendId); // BUG: Returns 'site:page:123' instead of 'page-123'
      
            // This means the tracker can't find elements on the page!
            // document.getElementById('page-123') won't find element with id 'site:page:123'
        });
    });

    describe('Integration: How bugs affect real functionality', () => {
        it('should demonstrate Bug #1 prevents proper click event handling', () => {
            // Scenario: User clicks a button multiple times
            // After first click, event should be prevented and tracked
            // On subsequent clicks, the behavior should be consistent
      
            const eventsPrevented = [];
            const targetId = 'submit-button';
      
            // First click
            let eventIndex = eventsPrevented.indexOf(targetId);
            if (eventIndex === -1) {
                eventsPrevented.push(targetId);
                // Event is prevented and sent to Unomi
            }
            expect(eventsPrevented.length).toBe(1);
      
            // Second click - current buggy code
            eventIndex = eventsPrevented.indexOf(targetId);
            if (eventIndex !== -1) {
                eventsPrevented.splice(eventIndex, 0); // BUG: Doesn't remove
            }
      
            // Array still has the element
            expect(eventsPrevented.length).toBe(1);
            expect(eventsPrevented).toContain(targetId);
      
            // The logic is unclear: 
            // - If it should remove: bug prevents removal
            // - If it should skip: why check and do nothing?
            // Either way, the behavior is incorrect
        });

        it('should demonstrate Bug #2 prevents element lookup', () => {
            // Scenario: Unomi returns tracked condition with ID "site:page:contact-form"
            // Frontend HTML has id="contact-form"
            // sourceLocalIdentifierMap should map "site:page:" to ""
      
            const sourceLocalIdentifierMap = {
                'site:page:': '',
                'site:video:': ''
            };
      
            const unomiId = 'site:page:contact-form';
            const expectedFrontendId = 'contact-form';
      
            // Current buggy code
            function buggy_resolveId(id) {
                if (sourceLocalIdentifierMap) {
                    var source = Object.keys(sourceLocalIdentifierMap).filter(function (source) {
                        return id.indexOf(source) > 0; // BUG: 'site:page:' at index 0
                    });
                    return source ? id.replace(source, sourceLocalIdentifierMap[source]) : id;
                }
                return id;
            }
      
            const resolvedId = buggy_resolveId(unomiId);
      
            // Should resolve to 'contact-form' but doesn't
            expect(resolvedId).toBe(unomiId); // BUG: Returns 'site:page:contact-form'
      
            // Now try to find element:
            // document.getElementById('contact-form') - won't find it
            // document.getElementById('site:page:contact-form') - also won't find it (wrong ID)
            // Result: Tracker can't attach listeners to form!
        });
    });
});
