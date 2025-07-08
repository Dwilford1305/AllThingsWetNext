function parseNameAndContactSimplified(nameContactText) {
  if (!nameContactText) {
    return { businessName: '', contact: '' }
  }

  // List of endings that usually mean the business name is over
  const businessEndings = [
    'Ltd', 'Inc', 'Corp', 'Co', 'LLC', 'Limited', 'Services', 'Service', 'Restaurant', 'Cafe', 'Centre', 'Center', 'Group', 'Club', 'Hotel', 'Inn', 'Bar', 'Grill', 'Kitchen', 'Market', 'Auto', 'Motors', 'Sales', 'Clinic', 'Hospital', 'Salon', 'Studio', 'Fitness', 'Gym', 'Pizza', 'Pasta', 'Liquor', 'Gas', 'Oil', 'Tire', 'Glass', 'Electric', 'Plumbing', 'Construction', 'Contracting', 'Cleaning', 'Pharmacy', 'Bank', 'Insurance', 'Travel', 'Agency', 'Consulting', 'Solutions', 'Systems', 'Tech', 'Communications', 'Media', 'Design', 'Graphics', 'Printing', 'Photography', 'Entertainment', 'Equipment', 'Supply', 'Supplies', 'Parts', 'Repair', 'Maintenance', 'Security', 'Safety', 'Training', 'Education', 'Academy', 'School', 'Institute', 'Foundation', 'Association', 'Society', 'Network', 'Taxi', 'Cab', 'Rental', 'Rentals', 'Finance', 'Financial', 'Investment', 'Holdings', 'Properties', 'Development', 'Management', 'Shop'
  ];

  // Insert a space after any business ending if glued to a capitalized word
  let businessName = nameContactText.trim();
  for (const ending of businessEndings) {
    const gluedPattern = new RegExp(`(${ending})([A-Z][a-z]+)`, 'g');
    businessName = businessName.replace(gluedPattern, '$1 $2');
  }
  // Also insert a space before any capitalized word that follows a lowercase, symbol, or period
  businessName = businessName
    .replace(/([a-z0-9\)\]\.!?])([A-Z][a-z]+)/g, '$1 $2')
    .replace(/([a-z])([A-Z][A-Z]+)/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2');

  let contact = '';

  // Try to split by business ending
  for (const ending of businessEndings) {
    const pattern = new RegExp(`^(.+?\\b${ending}\\b\\.?)(?:\\s+|$)([A-Z][a-z]+(?:\\s+(?:Mc|Mac)?[A-Z][a-z]+){0,2})?$`, 'i');
    const match = businessName.match(pattern);
    if (match) {
      businessName = match[1].trim();
      contact = (match[2] || '').trim();
      return { businessName, contact };
    }
  }

  // If not found, try to extract the last 1-3 words as contact if they look like names or are 'and'/'&'
  let words = businessName.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    if (words.length > n) {
      const lastN = words.slice(-n);
      // Accept if all are capitalized, or are 'and'/'&', or look like names (including Mc/Mac)
      if (lastN.every(w => /^[A-Z][a-z]+$/.test(w) || /^Mc[A-Z][a-z]+$/.test(w) || /^Mac[A-Z][a-z]+$/.test(w) || w.toLowerCase() === 'and' || w === '&')) {
        // Don't treat as contact if the last word is a business ending
        if (!businessEndings.includes(lastN[lastN.length - 1])) {
          businessName = words.slice(0, -n).join(' ');
          contact = lastN.join(' ');
          return { businessName, contact };
        }
      }
    }
  }

  // Otherwise, treat the whole thing as business name
  return { businessName, contact };
}

// Test with sample data
const testCases = [
  'A & W Canada Steven',
  '2 for 1 Pizza & Pasta Steven',
  'Acme Fence & Welding Ltd. Larry',
  'Agro Enterprises Ltd. Brent',
  'Boston Pizza Restaurant & Sports Bar Michael',
  'Canadian Tire Corporation John',
  'Pizza Hut Express Sarah',
  'A Z Wetaskiwin Storage Shanina and Dan',
  'AEM Fabrication Ltd',
  'ATCO Gas',
  'AV Lights &',
  'Amen Thrift ShopTammy Becsko',
  'AC Dandy Temp Power LTDBrent McLean',
  'Smith & Sons Ltd.McDonald',
  'Super CleanersShopTammy',
  'Quick OilChangeJohn',
  'Big MacBurgerMacDonald',
  'A&W RestaurantColleen',
  'A Z Wetaskiwin StorageShanina and Dan'
];

testCases.forEach(test => {
  console.log('\n=== Testing:', test, '===')
  const result = parseNameAndContactSimplified(test)
  console.log('Result:', result)
})
