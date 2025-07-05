// Test and refine regex patterns for Wetaskiwin.ca date/time extraction

const testStrings = [
  "July 19, 2025, 10:00 AM - 4:00 PM@ Wetaskiwin Pet Centre",
  "July 9, 2025, 3:00 PM - 6:00 PM@ Wetaskiwin Agriculture Grounds", 
  "July 20, 2025, 9:00 AM - 11:30 AM",
  "July 26, 2025, 10:00 AM@ Wetaskiwin Legion",
  "July 26, 2025, 9:00 AM - July 27, 2025, 5:00 PM",
  "July 30, 2025, 11:00 AM - 4:00 PM@ Pidherney Curling Centre",
  "January 1, 2025, 9:00 AM - September 22, 2025, 12:00 PM@ City Hall"
];

console.log('=== TESTING REGEX PATTERNS ===\n');

function testPattern(pattern, description) {
  console.log(`--- ${description} ---`);
  console.log(`Pattern: ${pattern.source}`);
  
  testStrings.forEach((testStr, i) => {
    const match = testStr.match(pattern);
    console.log(`Test ${i + 1}: "${testStr}"`);
    if (match) {
      console.log(`  ✓ MATCH: Date="${match[1]}", Time="${match[2]}", Location="${match[3] || 'N/A'}"`);
    } else {
      console.log(`  ✗ NO MATCH`);
    }
    console.log('');
  });
  
  console.log('');
}

// Current patterns (failing)
console.log('=== CURRENT PATTERNS (FAILING) ===\n');

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/,
  "Pattern 1 - Current"
);

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/,
  "Pattern 2 - Current Multi-day"
);

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/,
  "Pattern 3 - Current Simple"
);

// New improved patterns
console.log('=== NEW IMPROVED PATTERNS ===\n');

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}:\d{2} [AP]M)(?: - \d{1,2}:\d{2} [AP]M)?(?:@ (.+))?/,
  "New Pattern 1 - With optional location"
);

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}:\d{2} [AP]M) - [A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/,
  "New Pattern 2 - Multi-day exact"
);

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}:\d{2} [AP]M)/,
  "New Pattern 3 - Simple exact"
);

// Test even more flexible patterns
console.log('=== MOST FLEXIBLE PATTERNS ===\n');

testPattern(
  /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}:\d{2} [AP]M).*?(?:@ (.+?))?$/,
  "Flexible Pattern - Capture everything"
);

// Test location extraction separately
console.log('=== LOCATION EXTRACTION TEST ===\n');

testStrings.forEach((testStr, i) => {
  console.log(`Test ${i + 1}: "${testStr}"`);
  
  // Extract location with @ symbol
  const atMatch = testStr.match(/@\s*(.+?)$/);
  if (atMatch) {
    console.log(`  @ Location: "${atMatch[1]}"`);
  }
  
  // Extract location without @ (after time range)
  const afterTimeMatch = testStr.match(/\d{1,2}:\d{2} [AP]M(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*(.+?)$/);
  if (afterTimeMatch && !afterTimeMatch[1].includes('@')) {
    console.log(`  After-time Location: "${afterTimeMatch[1]}"`);
  }
  
  console.log('');
});
