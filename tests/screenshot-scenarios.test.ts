import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Screenshot Scenarios - Comprehensive Validation', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  test('validates all screenshot scenarios are correctly parsed', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // Test cases representing common scenarios that could appear in screenshots
    const testCases = [
      // Cases that should extract contact names
      { input: 'ABC Auto Repair John', expectedBusiness: 'ABC Auto Repair', expectedContact: 'John' },
      { input: 'Pizza Palace Bob', expectedBusiness: 'Pizza Palace', expectedContact: 'Bob' },
      { input: 'XYZ Auto Repair John Smith', expectedBusiness: 'XYZ Auto Repair', expectedContact: 'John Smith' },
      { input: 'Hair Salon Services Sarah', expectedBusiness: 'Hair Salon Services', expectedContact: 'Sarah' },
      { input: 'Coffee Shop Lisa', expectedBusiness: 'Coffee Shop', expectedContact: 'Lisa' },
      { input: 'Auto Service Tom Wilson', expectedBusiness: 'Auto Service', expectedContact: 'Tom Wilson' },
      { input: 'Quick Oil Change Mike', expectedBusiness: 'Quick Oil Change', expectedContact: 'Mike' },
      { input: 'Pizza Restaurant Tony', expectedBusiness: 'Pizza Restaurant', expectedContact: 'Tony' },
      { input: 'Coffee House Jane', expectedBusiness: 'Coffee House', expectedContact: 'Jane' },
      { input: 'Tire Center Bob', expectedBusiness: 'Tire Center', expectedContact: 'Bob' },
      
      // Cases that should NOT extract contact names (business words should stay with business)
      { input: 'Johnson Auto Repair', expectedBusiness: 'Johnson Auto Repair', expectedContact: '' },
      { input: 'Smith Construction', expectedBusiness: 'Smith Construction', expectedContact: '' },
      { input: 'Wilson Plumbing', expectedBusiness: 'Wilson Plumbing', expectedContact: '' },
      { input: 'Brown Electric', expectedBusiness: 'Brown Electric', expectedContact: '' },
      { input: 'Davis Tire Services', expectedBusiness: 'Davis Tire Services', expectedContact: '' },
      { input: 'Miller Auto Shop', expectedBusiness: 'Miller Auto Shop', expectedContact: '' },
      { input: 'Thompson Restaurant', expectedBusiness: 'Thompson Restaurant', expectedContact: '' },
      { input: 'Anderson Cleaning Services', expectedBusiness: 'Anderson Cleaning Services', expectedContact: '' },
      { input: 'Best Auto Service', expectedBusiness: 'Best Auto Service', expectedContact: '' },
      { input: 'Auto Repair Center', expectedBusiness: 'Auto Repair Center', expectedContact: '' },
      { input: 'Gas Station Store', expectedBusiness: 'Gas Station Store', expectedContact: '' },
      { input: 'Pizza Palace', expectedBusiness: 'Pizza Palace', expectedContact: '' },
      { input: 'Coffee House', expectedBusiness: 'Coffee House', expectedContact: '' },
      { input: 'Auto Center', expectedBusiness: 'Auto Center', expectedContact: '' },
      { input: 'Service Station', expectedBusiness: 'Service Station', expectedContact: '' },
      { input: 'Repair Shop', expectedBusiness: 'Repair Shop', expectedContact: '' },
      { input: 'Food Store', expectedBusiness: 'Food Store', expectedContact: '' },
      { input: 'Car Wash', expectedBusiness: 'Car Wash', expectedContact: '' },
      { input: 'Gas Station', expectedBusiness: 'Gas Station', expectedContact: '' }
    ];

    console.log('\n=== Testing Screenshot Scenarios ===\n');

    testCases.forEach((testCase, index) => {
      const result = parseNameAndContact(testCase.input);
      
      console.log(`${index + 1}. "${testCase.input}"`);
      console.log(`   Expected: Business="${testCase.expectedBusiness}", Contact="${testCase.expectedContact}"`);
      console.log(`   Actual:   Business="${result.businessName}", Contact="${result.contact}"`);
      
      // Check if results match expectations
      const businessMatches = result.businessName === testCase.expectedBusiness;
      const contactMatches = result.contact === testCase.expectedContact;
      
      if (businessMatches && contactMatches) {
        console.log(`   ✅ PASS`);
      } else {
        console.log(`   ❌ FAIL`);
        if (!businessMatches) {
          console.log(`      Business mismatch: expected "${testCase.expectedBusiness}", got "${result.businessName}"`);
        }
        if (!contactMatches) {
          console.log(`      Contact mismatch: expected "${testCase.expectedContact}", got "${result.contact}"`);
        }
      }
      
      console.log('');
      
      // Assertions for the test framework
      expect(result.businessName).toBe(testCase.expectedBusiness);
      expect(result.contact).toBe(testCase.expectedContact);
    });
  });

  test('validates no common misattribution patterns exist', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);
    
    // Test cases that historically caused problems
    const problematicCases = [
      'ABC Auto Repair John',
      'Pizza Palace Bob',
      'XYZ Auto Repair John Smith',
      'Wilson Construction', 
      'Smith Services',
      'Johnson Auto Repair'
    ];

    problematicCases.forEach(testCase => {
      const result = parseNameAndContact(testCase);
      
      // Check that business words don't appear in contact field
      const businessWords = ['auto', 'repair', 'service', 'services', 'restaurant', 'salon', 'shop', 'center', 'centre', 'palace', 'house', 'plaza', 'tire', 'gas', 'oil', 'coffee', 'pizza', 'food', 'car', 'wash', 'station', 'construction', 'plumbing', 'electric'];
      const contactWords = result.contact.toLowerCase().split(' ').filter(w => w.length > 0);
      
      const businessWordInContact = contactWords.find(word => businessWords.includes(word));
      expect(businessWordInContact).toBeUndefined();
      
      // Check that contact names don't appear in business name when they should be separate
      const commonFirstNames = ['john', 'mike', 'bob', 'jim', 'tom', 'lisa', 'sarah', 'jane', 'tony', 'dave', 'steve', 'chris', 'mark', 'paul', 'mary', 'susan'];
      const businessNameWords = result.businessName.toLowerCase().split(' ');
      
      // If we have a contact name, the business name shouldn't end with that contact name
      if (result.contact) {
        const contactFirstName = result.contact.split(' ')[0].toLowerCase();
        expect(businessNameWords[businessNameWords.length - 1]).not.toBe(contactFirstName);
      }
    });
  });
});