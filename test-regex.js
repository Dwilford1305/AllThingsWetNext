// Test the regex patterns against the sample texts from debug output

const testTexts = [
  "January 1, 2025, 9:00 AM - September 22, 2025, 12:00 PM@ City Hall",
  "July 19, 2025, 10:00 AM - 4:00 PM@ Wetaskiwin Pet Centre",
  "July 9, 2025, 3:00 PM - 6:00 PM@ Wetaskiwin Agriculture Grounds",
  "July 10, 2025, 10:00 AM - 12:00 PM@ Church of God",
  "July 20, 2025, 9:00 AM - 11:30 AM",
  "July 26, 2025, 9:00 AM - July 27, 2025, 5:00 PM",
  "July 26, 2025, 10:00 AM@ Wetaskiwin Legion"
];

console.log('Testing regex patterns...\n');

testTexts.forEach((text, index) => {
  console.log(`Text ${index + 1}: "${text}"`);
  
  // Pattern 1: Updated pattern
  const pattern1 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/);
  
  // Pattern 2: Multi-day
  const pattern2 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
  
  // Pattern 3: Simple
  const pattern3 = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/);
  
  if (pattern1) {
    console.log(`  ✓ Pattern 1: Date="${pattern1[1]}", Time="${pattern1[2]}", Location="${pattern1[3] || 'none'}"`);
  } else if (pattern2) {
    console.log(`  ✓ Pattern 2: Date="${pattern2[1]}", Time="${pattern2[2]}"`);
  } else if (pattern3) {
    console.log(`  ✓ Pattern 3: Date="${pattern3[1]}", Time="${pattern3[2]}"`);
  } else {
    console.log('  ✗ No pattern matched');
  }
  
  console.log('');
});

console.log('Current date for comparison:', new Date().toISOString());
