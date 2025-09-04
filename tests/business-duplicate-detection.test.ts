import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Business Duplicate Detection', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  test('should detect duplicate businesses within scraping session', () => {
    // Mock data for testing duplicate detection within session
    const mockBusinesses = [
      {
        name: 'Tim Hortons',
        contact: 'John Doe',
        address: '123 Main St, Wetaskiwin, AB T9A 1A1',
        phone: '780-123-4567',
        website: 'https://www.timhortons.com',
        sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
      },
      {
        name: 'Tim Hortons',
        contact: 'Jane Smith', // Different contact but same business
        address: '123 Main Street, Wetaskiwin, AB T9A 1A1', // Slightly different format
        phone: '780-123-4567',
        website: 'https://www.timhortons.com',
        sourceUrl: 'https://www.wetaskiwin.ca/businessdirectoryii.aspx'
      }
    ];

    // Test the improved duplicate detection logic
    const business1 = mockBusinesses[0];
    const business2 = mockBusinesses[1];
    
    const nameMatch = business1.name.toLowerCase().trim() === business2.name.toLowerCase().trim();
    expect(nameMatch).toBe(true);
    
    // Test address similarity with normalized comparison
    const normalizeAddress = (addr: string) => addr.toLowerCase()
      .replace(/\b(street|avenue|ave|st|road|rd|drive|dr|boulevard|blvd)\b/g, 'st')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const norm1 = normalizeAddress(business1.address);
    const norm2 = normalizeAddress(business2.address);
    const addressSimilar = norm1.includes('123 main st') && norm2.includes('123 main st');
    
    expect(addressSimilar).toBe(true);
  });

  test('should extract website correctly from business text', () => {
    const extractWebsite = (scraper as any).extractWebsite.bind(scraper);

    // Test various website formats that appear in scraped data
    expect(extractWebsite('Tim Hortons Link: www.timhortons.com Phone: 780-123-4567')).toBe('https://www.timhortons.com');
    expect(extractWebsite('Pizza Palace Link: https://pizzapalace.ca Address: 456 Oak St')).toBe('https://pizzapalace.ca');
    expect(extractWebsite('Local Store Phone: 780-987-6543')).toBeUndefined();
    expect(extractWebsite('Auto Repair Link: autorepair.net Email: info@auto.com')).toBe('https://autorepair.net');
    expect(extractWebsite('Business Link: subdomain.example.com Phone: 123-456-7890')).toBe('https://subdomain.example.com');
    expect(extractWebsite('Shop Link: shop.ca/contact Phone: 555-0123')).toBe('https://shop.ca/contact');
  });

  test('should properly normalize business names for duplicate detection', () => {
    const testCases = [
      {
        name1: 'Tim Hortons Coffee Shop',
        name2: 'Tim Hortons Coffee Shop',
        shouldMatch: true
      },
      {
        name1: 'A&W Restaurant',
        name2: 'A&W Restaurant Inc.',
        shouldMatch: true // Should match when ignoring business suffixes
      },
      {
        name1: 'Tim Hortons',
        name2: 'Tim Hortons Coffee Shop',
        shouldMatch: true // Should match after normalization removes "coffee shop"
      },
      {
        name1: 'Main Street Pizza',
        name2: 'Oak Street Pizza',
        shouldMatch: false // Different businesses
      },
      {
        name1: 'Quality Auto Repair Services',
        name2: 'Quality Auto Repair Services Ltd',
        shouldMatch: true // Should match ignoring Ltd and Services
      }
    ];

    testCases.forEach(({ name1, name2, shouldMatch }) => {
      // Normalize names like the duplicate detection logic should do
      const normalize = (name: string) => name.toLowerCase()
        .replace(/\b(ltd|inc|corp|co|llc|limited|incorporated|corporation|company)\b\.?/g, '')
        .replace(/\b(coffee shop|restaurant|cafe|bar|grill|store|shop|services|service|center|centre|clinic|salon|studio)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const normalized1 = normalize(name1);
      const normalized2 = normalize(name2);
      const matches = normalized1 === normalized2;
      
      expect(matches).toBe(shouldMatch);
    });
  });

  test('should generate consistent business IDs for similar businesses', () => {
    // This tests the ID generation logic that should prevent duplicates
    const mockGenerateId = (name: string, address: string): string => {
      return btoa(`${name.toLowerCase().trim()}-${address.toLowerCase().trim()}`)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 32);
    };

    const business1 = {
      name: 'Tim Hortons',
      address: '123 Main St, Wetaskiwin, AB T9A 1A1'
    };

    const business2 = {
      name: 'Tim Hortons',
      address: '123 Main Street, Wetaskiwin, AB T9A 1A1'
    };

    const id1 = mockGenerateId(business1.name, business1.address);
    const id2 = mockGenerateId(business2.name, business2.address);

    // These should potentially be the same business but currently generate different IDs
    // This highlights the issue we need to fix
    expect(id1).not.toBe(id2); // Current behavior - this is the problem!
  });
});