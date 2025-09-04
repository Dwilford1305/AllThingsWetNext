import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Business Duplicate Detection Fix', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  test('should detect duplicates with similar business names after improved normalization', () => {
    // Set up existing businesses that would be in the database
    const existingBusinesses = [
      {
        id: 'tim-hortons-123',
        name: 'Tim Hortons',
        address: '123 Main St, Wetaskiwin, AB T9A 1A1'
      }
    ];

    // Set the existing businesses for the scraper
    (scraper as any).existingBusinesses = existingBusinesses;

    // Test business with variation in name (should be detected as duplicate)
    const testBusiness = {
      name: 'Tim Hortons Coffee Shop',  // Has "Coffee Shop" added
      contact: 'John Manager',
      address: '123 Main Street, Wetaskiwin, AB T9A 1A1', // Slightly different address format
      phone: '780-123-4567',
      website: 'https://www.timhortons.com',
      sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    };

    const isDuplicateBusiness = (scraper as any).isDuplicateBusiness.bind(scraper);
    const isDuplicate = isDuplicateBusiness(testBusiness, []);

    // Should be detected as duplicate due to improved normalization
    expect(isDuplicate).toBe(true);
  });

  test('should detect duplicates using fuzzy matching for similar names', () => {
    const existingBusinesses = [
      {
        id: 'pizza-palace-456',
        name: 'Pizza Palace Restaurant',
        address: '456 Oak St, Wetaskiwin, AB T9A 2B2'
      }
    ];

    (scraper as any).existingBusinesses = existingBusinesses;

    // Test business with similar but not identical name
    const testBusiness = {
      name: 'Pizza Palace',  // Missing "Restaurant" but same business
      contact: 'Maria Owner',
      address: '456 Oak Street, Wetaskiwin, AB T9A 2B2',
      sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    };

    const isDuplicateBusiness = (scraper as any).isDuplicateBusiness.bind(scraper);
    const isDuplicate = isDuplicateBusiness(testBusiness, []);

    // Should be detected as duplicate due to fuzzy matching
    expect(isDuplicate).toBe(true);
  });

  test('should not detect non-duplicates as duplicates', () => {
    const existingBusinesses = [
      {
        id: 'auto-repair-789',
        name: 'Quality Auto Repair',
        address: '789 Industrial Ave, Wetaskiwin, AB T9A 3C3'
      }
    ];

    (scraper as any).existingBusinesses = existingBusinesses;

    // Test completely different business
    const testBusiness = {
      name: 'Hair Salon Excellence',
      contact: 'Sarah Stylist',
      address: '321 Centre St, Wetaskiwin, AB T9A 4D4',
      sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
    };

    const isDuplicateBusiness = (scraper as any).isDuplicateBusiness.bind(scraper);
    const isDuplicate = isDuplicateBusiness(testBusiness, []);

    // Should NOT be detected as duplicate
    expect(isDuplicate).toBe(false);
  });

  test('should properly normalize business names by removing descriptive terms', () => {
    const normalizeBusinessName = (scraper as any).normalizeBusinessName.bind(scraper);

    const testCases = [
      {
        input: 'Tim Hortons Coffee Shop',
        expected: 'tim hortons',
        description: 'should remove "coffee shop"'
      },
      {
        input: 'McDonald\'s Restaurant',
        expected: 'mcdonalds',
        description: 'should remove "restaurant"'
      },
      {
        input: 'Quality Auto Repair Services',
        expected: 'quality auto repair',
        description: 'should remove "services"'
      },
      {
        input: 'Downtown Hair Salon & Spa',
        expected: 'downtown hair',
        description: 'should remove "salon"'
      },
      {
        input: '7-Eleven Convenience Store',
        expected: '7eleven convenience',
        description: 'should remove "store"'
      }
    ];

    testCases.forEach(({ input, expected, description }) => {
      const result = normalizeBusinessName(input);
      expect(result).toBe(expected);
    });
  });

  test('should handle fuzzy name matching correctly', () => {
    const businessNamesAreSimilar = (scraper as any).businessNamesAreSimilar.bind(scraper);

    const testCases = [
      {
        name1: 'tim hortons',
        name2: 'tim hortons coffee',
        shouldMatch: true,
        description: 'should match when one name contains the other'
      },
      {
        name1: 'pizza palace',
        name2: 'pizza palace restaurant',
        shouldMatch: true,
        description: 'should match when names have shared core words'
      },
      {
        name1: 'auto repair',
        name2: 'hair salon',
        shouldMatch: false,
        description: 'should not match completely different names'
      },
      {
        name1: 'smith law office',
        name2: 'smith law',
        shouldMatch: true,
        description: 'should match when majority of words are the same'
      },
      {
        name1: 'a',
        name2: 'abc auto repair services center',
        shouldMatch: false,
        description: 'should not match when length ratio is too high'
      }
    ];

    testCases.forEach(({ name1, name2, shouldMatch, description }) => {
      const result = businessNamesAreSimilar(name1, name2);
      expect(result).toBe(shouldMatch);
    });
  });

  test('should improve name parsing to reduce malformed business names', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // Test that the improved parsing cleans up artifacts
    const result = parseNameAndContact('  @#$Tim Hortons Coffee Shop@#$  ');
    
    expect(result.businessName).toBe('Tim Hortons Coffee Shop');
    expect(result.contact).toBe('');
  });
});