import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Detailed Business Parsing Debug', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  test('debug specific failing cases', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // Test case that's failing: ABC Auto Repair John
    console.log('\n=== Debugging ABC Auto Repair John ===');
    const result1 = parseNameAndContact('ABC Auto Repair John');
    console.log('Input: "ABC Auto Repair John"');
    console.log('Output:', result1);
    console.log('Expected: { businessName: "ABC Auto Repair", contact: "John" }');
    
    // Test similar cases to understand the pattern
    console.log('\n=== Testing similar patterns ===');
    
    const testCases = [
      'ABC Auto Repair John',
      'XYZ Auto Repair John Smith', 
      'Quality Auto Service Bob',
      'Best Auto Repair Mike Johnson',
      'Pizza Palace Restaurant Bob',
      'Hair Salon Bob',
      'Auto Repair John',
      'Service John',
      'Restaurant Bob'
    ];
    
    testCases.forEach(testCase => {
      const result = parseNameAndContact(testCase);
      console.log(`"${testCase}" -> Business: "${result.businessName}", Contact: "${result.contact}"`);
    });
  });
});