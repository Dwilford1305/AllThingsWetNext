import { WetaskiwinBusinessScraper } from '../src/lib/scrapers/wetaskiwinBusiness';

describe('Business Name Parsing Issues - Reproducing GitHub Issue', () => {
  let scraper: WetaskiwinBusinessScraper;

  beforeEach(() => {
    scraper = new WetaskiwinBusinessScraper();
  });

  // Test cases that should reproduce the misattribution issues mentioned in the GitHub issue
  test('should not append manager first names to business names', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // These test cases expose potential issues where manager's first name gets appended to business name
    
    // Test case 1: Single first name being appended
    const result1 = parseNameAndContact('ABC Auto Repair John');
    console.log('Test 1 result:', result1);
    expect(result1.businessName).not.toContain('John');
    expect(result1.businessName).toBe('ABC Auto Repair');
    expect(result1.contact).toBe('John');
    
    // Test case 2: Business ending with single name
    const result2 = parseNameAndContact('Pizza Palace Bob');
    console.log('Test 2 result:', result2);
    expect(result2.businessName).not.toContain('Bob');
    expect(result2.businessName).toBe('Pizza Palace');
    expect(result2.contact).toBe('Bob');
    
    // Test case 3: Service business with single name
    const result3 = parseNameAndContact('Hair Salon Sarah');
    console.log('Test 3 result:', result3);
    expect(result3.businessName).not.toContain('Sarah');
    expect(result3.businessName).toBe('Hair Salon');
    expect(result3.contact).toBe('Sarah');
  });

  test('should not put last word of business name in manager field', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // These test cases expose issues where the last word of business name appears in 'managed by' field
    
    // Test case 1: Business name ending with common business word
    const result1 = parseNameAndContact('Johnson Auto Repair');
    console.log('Johnson Auto Repair result:', result1);
    expect(result1.businessName).toBe('Johnson Auto Repair');
    expect(result1.contact).toBe('');
    expect(result1.contact).not.toContain('Repair');
    
    // Test case 2: Services business
    const result2 = parseNameAndContact('Smith Services');
    console.log('Smith Services result:', result2);
    expect(result2.businessName).toBe('Smith Services');
    expect(result2.contact).toBe('');
    expect(result2.contact).not.toContain('Services');
    
    // Test case 3: Construction business
    const result3 = parseNameAndContact('Wilson Construction');
    console.log('Wilson Construction result:', result3);
    expect(result3.businessName).toBe('Wilson Construction');
    expect(result3.contact).toBe('');
    expect(result3.contact).not.toContain('Construction');
  });

  test('should handle edge cases with business endings and names', () => {
    const parseNameAndContact = (scraper as any).parseNameAndContactSimplified.bind(scraper);

    // Edge cases that might cause confusion between business names and contact names
    
    // Test case 1: Business ending + full contact name
    const result1 = parseNameAndContact('Auto Repair Services John Smith');
    console.log('Auto Repair Services John Smith result:', result1);
    expect(result1.businessName).toBe('Auto Repair Services');
    expect(result1.contact).toBe('John Smith');
    
    // Test case 2: Restaurant with single name
    const result2 = parseNameAndContact('Pizza Restaurant Bob');
    console.log('Pizza Restaurant Bob result:', result2);
    expect(result2.businessName).toBe('Pizza Restaurant');
    expect(result2.contact).toBe('Bob');
    
    // Test case 3: Service business without contact
    const result3 = parseNameAndContact('Hair Salon Services');
    console.log('Hair Salon Services result:', result3);
    expect(result3.businessName).toBe('Hair Salon Services');
    expect(result3.contact).toBe('');
  });
});