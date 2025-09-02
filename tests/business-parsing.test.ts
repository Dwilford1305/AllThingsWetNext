import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Business Name Parsing and Website Extraction', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  test('should extract website URLs correctly', () => {
    // Access private method for testing via TypeScript tricks
    const extractWebsite = (scraper as any).extractWebsite.bind(scraper);

    expect(extractWebsite('ABC Auto Repair Link: www.abcauto.com Phone: 780-123-4567')).toBe('https://www.abcauto.com');
    expect(extractWebsite('Smith Law Link: https://smithlaw.ca Phone: 780-345-6789')).toBe('https://smithlaw.ca');
    expect(extractWebsite('Pizza Palace Phone: 780-234-5678')).toBeUndefined();
    expect(extractWebsite('Tim Hortons Link: www.timhortons.com Hours: 6am-10pm')).toBe('https://www.timhortons.com');
  });

  test('should parse business names and contact names correctly', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // Test cases with proper separation
    expect(parseNameAndContact('ABC Auto Repair Ltd John Smith')).toEqual({
      businessName: 'ABC Auto Repair Ltd',
      contact: 'John Smith'
    });

    expect(parseNameAndContact('Pizza Palace Restaurant')).toEqual({
      businessName: 'Pizza Palace Restaurant',
      contact: ''
    });

    expect(parseNameAndContact('Smith & Associates Law Office David Smith')).toEqual({
      businessName: 'Smith & Associates Law Office',
      contact: 'David Smith'
    });

    // Test concatenated words
    expect(parseNameAndContact('Johnson\'s Auto ServiceGary Johnson')).toEqual({
      businessName: 'Johnson\'s Auto Service',
      contact: 'Gary Johnson'
    });

    expect(parseNameAndContact('Hair SalonSarah Wilson')).toEqual({
      businessName: 'Hair Salon',
      contact: 'Sarah Wilson'
    });

    expect(parseNameAndContact('McDonald\'s RestaurantBob Johnson')).toEqual({
      businessName: 'McDonald\'s Restaurant',
      contact: 'Bob Johnson'
    });
  });

  test('should handle business names without contact persons', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    expect(parseNameAndContact('Tim Hortons Coffee Shop')).toEqual({
      businessName: 'Tim Hortons Coffee Shop',
      contact: ''
    });

    expect(parseNameAndContact('7-Eleven Convenience Store')).toEqual({
      businessName: '7-Eleven Convenience Store',
      contact: ''
    });
  });

  test('should not extract business endings as contact names', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    expect(parseNameAndContact('Quality Auto Service')).toEqual({
      businessName: 'Quality Auto Service',
      contact: ''
    });

    expect(parseNameAndContact('Downtown Hair Salon')).toEqual({
      businessName: 'Downtown Hair Salon',
      contact: ''
    });
  });

  test('should handle complex business names with multiple parts', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    expect(parseNameAndContact('Smith & Associates Professional Law Office Michael Smith')).toEqual({
      businessName: 'Smith & Associates Professional Law Office',
      contact: 'Michael Smith'
    });

    expect(parseNameAndContact('A1 Quality Auto Repair and Tire Service Bob Johnson')).toEqual({
      businessName: 'A1 Quality Auto Repair and Tire Service',
      contact: 'Bob Johnson'
    });
  });
});