const axios = require('axios');
const cheerio = require('cheerio');

async function debugWetaskiwinScraping() {
  console.log('=== DETAILED WETASKIWIN.CA SCRAPING DEBUG ===\n');
  
  try {
    const calendarUrl = 'https://wetaskiwin.ca/calendar.aspx?CID=25,23&showPastEvents=false';
    console.log(`Fetching: ${calendarUrl}\n`);
    
    const response = await axios.get(calendarUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const $ = cheerio.load(response.data);
    const events = [];
    let eventIndex = 0;
    
    console.log('Processing H3 elements...\n');
    
    $('h3').each((index, element) => {
      const $heading = $(element);
      const $link = $heading.find('a[href*="Calendar.aspx"]');
      
      console.log(`--- H3 #${index + 1} ---`);
      console.log(`Text: "${$heading.text().trim()}"`);
      console.log(`Has calendar link: ${$link.length > 0}`);
      
      if ($link.length > 0) {
        const title = $link.text().trim();
        const eventUrl = $link.attr('href');
        
        console.log(`Title: "${title}"`);
        console.log(`Event URL: "${eventUrl}"`);
        
        if (title && eventUrl) {
          // Look for event details in the content after the heading
          let description = '';
          let dateText = '';
          let timeText = '';
          let location = '';
          
          console.log('Searching for event details in subsequent elements...');
          
          let $current = $heading.next();
          let elementCount = 0;
          
          while ($current.length > 0 && $current.prop('tagName') !== 'H3' && elementCount < 10) {
            const text = $current.text().trim();
            
            console.log(`  Element ${elementCount + 1} (${$current.prop('tagName')}): "${text}"`);
            
            if (text) {
              // Test all regex patterns
              console.log('  Testing regex patterns...');
              
              // Pattern 1: "July 9, 2025, 3:00 PM - 6:00 PM @ Location" or "July 9, 2025, 3:00 PM - 6:00 PM@ Location"
              let dateTimeMatch = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/);
              console.log(`    Pattern 1 match:`, dateTimeMatch ? 'YES' : 'NO');
              if (dateTimeMatch) {
                console.log(`      Date: "${dateTimeMatch[1]}", Time: "${dateTimeMatch[2]}", Location: "${dateTimeMatch[3] || 'N/A'}"`);
              }
              
              // Pattern 2: Multi-day
              if (!dateTimeMatch) {
                dateTimeMatch = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
                console.log(`    Pattern 2 match:`, dateTimeMatch ? 'YES' : 'NO');
                if (dateTimeMatch) {
                  console.log(`      Date: "${dateTimeMatch[1]}", Time: "${dateTimeMatch[2]}"`);
                }
              }
              
              // Pattern 3: Simple date time
              if (!dateTimeMatch) {
                dateTimeMatch = text.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/);
                console.log(`    Pattern 3 match:`, dateTimeMatch ? 'YES' : 'NO');
                if (dateTimeMatch) {
                  console.log(`      Date: "${dateTimeMatch[1]}", Time: "${dateTimeMatch[2]}"`);
                }
              }
              
              if (dateTimeMatch) {
                dateText = dateTimeMatch[1];
                timeText = dateTimeMatch[2];
                
                // Extract location
                const locationMatch = text.match(/@\s*(.+?)(?:\s|$)/);
                if (locationMatch) {
                  location = locationMatch[1].trim();
                } else if (dateTimeMatch[3] && dateTimeMatch[3].trim()) {
                  const potentialLocation = dateTimeMatch[3].trim();
                  if (potentialLocation && !potentialLocation.includes('AM') && !potentialLocation.includes('PM')) {
                    location = potentialLocation;
                  }
                }
                
                console.log(`    ✓ Found date/time info!`);
                console.log(`      Date: "${dateText}"`);
                console.log(`      Time: "${timeText}"`);
                console.log(`      Location: "${location}"`);
                
                // Get description
                const $nextDesc = $current.next();
                if ($nextDesc.length > 0) {
                  const descText = $nextDesc.text().trim();
                  if (descText && descText.length > 10 && !descText.includes('More Details')) {
                    description = descText;
                    console.log(`      Description: "${description}"`);
                  }
                }
                
                break;
              }
              
              // If no structured date found, look for description
              if (!description && text.length > 10 && !text.includes('More Details')) {
                description = text;
                console.log(`    Potential description: "${description}"`);
              }
            }
            
            $current = $current.next();
            elementCount++;
          }
          
          // If we found date information, process the event
          if (dateText && timeText) {
            console.log(`  🎯 Processing event with date/time info`);
            
            try {
              // Parse the date
              const eventDate = new Date(dateText);
              console.log(`    Parsed date: ${eventDate}`);
              console.log(`    Is valid date: ${!isNaN(eventDate.getTime())}`);
              
              // Add time to date
              const timeParts = timeText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
              if (timeParts) {
                let hours = parseInt(timeParts[1]);
                const minutes = parseInt(timeParts[2]);
                const ampm = timeParts[3]?.toLowerCase();

                if (ampm === 'pm' && hours !== 12) hours += 12;
                if (ampm === 'am' && hours === 12) hours = 0;

                eventDate.setHours(hours, minutes, 0, 0);
                console.log(`    Date with time: ${eventDate}`);
              }
              
              // Check if it's a future event
              const now = new Date();
              const isFuture = eventDate > now;
              console.log(`    Current time: ${now}`);
              console.log(`    Is future event: ${isFuture}`);
              
              if (isFuture) {
                const event = {
                  title,
                  description: description || title,
                  date: eventDate,
                  time: timeText,
                  location: location || 'Wetaskiwin, AB',
                  category: 'community',
                  organizer: 'City of Wetaskiwin',
                  website: eventUrl.startsWith('http') ? eventUrl : `https://wetaskiwin.ca${eventUrl}`,
                  sourceUrl: calendarUrl,
                  sourceName: 'City of Wetaskiwin'
                };
                
                events.push(event);
                eventIndex++;
                console.log(`    ✅ Event #${eventIndex} added to results`);
              } else {
                console.log(`    ❌ Event skipped - not a future event`);
              }
            } catch (parseError) {
              console.log(`    ❌ Error parsing date: ${parseError.message}`);
            }
          } else {
            console.log(`    ❌ Skipping event - no date/time information found`);
          }
        } else {
          console.log(`  ❌ Missing title or URL`);
        }
      }
      
      console.log('');
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total H3 elements found: ${$('h3').length}`);
    console.log(`Events with calendar links: ${$('h3').find('a[href*="Calendar.aspx"]').length}`);
    console.log(`Valid events processed: ${events.length}`);
    
    console.log(`\n=== EVENTS FOUND ===`);
    events.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Date: ${event.date.toDateString()}`);
      console.log(`   Time: ${event.time}`);
      console.log(`   Location: ${event.location}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error during debug:', error.message);
  }
}

debugWetaskiwinScraping();
