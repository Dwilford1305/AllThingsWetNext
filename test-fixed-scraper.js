const axios = require('axios');
const cheerio = require('cheerio');

async function testFixedWetaskiwinScraper() {
  console.log('=== TESTING FIXED WETASKIWIN SCRAPER ===\n');
  
  try {
    const calendarUrl = 'https://wetaskiwin.ca/calendar.aspx?CID=25,23&showPastEvents=false';
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
    
    $('h3').each((index, element) => {
      const $heading = $(element);
      const $link = $heading.find('a[href*="Calendar.aspx"]');
      
      if ($link.length > 0) {
        const title = $link.text().trim();
        const eventUrl = $link.attr('href');
        
        if (title && eventUrl) {
          let description = '';
          let dateText = '';
          let timeText = '';
          let location = '';
          
          let $current = $heading.next();
          while ($current.length > 0 && $current.prop('tagName') !== 'H3') {
            const text = $current.text().trim();
            
            if (text) {
              // Normalize whitespace - replace non-breaking spaces and other Unicode spaces with regular spaces
              const normalizedText = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
              
              console.log(`Processing "${title}"`);
              console.log(`Original text: "${text}"`);
              console.log(`Normalized text: "${normalizedText}"`);
              
              // Look for various date and time patterns
              let dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)(?:\s*-\s*\d{1,2}:\d{2} [AP]M)?\s*@?\s*(.+)?/);
              
              if (!dateTimeMatch) {
                dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*[A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
              }
              
              if (!dateTimeMatch) {
                dateTimeMatch = normalizedText.match(/([A-Za-z]+ \d{1,2}, \d{4}),\s*(\d{1,2}:\d{2} [AP]M)/);
              }
              
              if (dateTimeMatch) {
                dateText = dateTimeMatch[1];
                timeText = dateTimeMatch[2];
                
                // Extract location from the text
                const locationMatch = normalizedText.match(/@\s*(.+?)(?:\s|$)/);
                if (locationMatch) {
                  location = locationMatch[1].trim();
                } else if (dateTimeMatch[3] && dateTimeMatch[3].trim()) {
                  const potentialLocation = dateTimeMatch[3].trim();
                  if (potentialLocation && !potentialLocation.includes('AM') && !potentialLocation.includes('PM')) {
                    location = potentialLocation;
                  }
                }
                
                console.log(`✓ MATCH FOUND!`);
                console.log(`  Date: "${dateText}"`);
                console.log(`  Time: "${timeText}"`);
                console.log(`  Location: "${location}"`);
                
                // Parse the date
                const eventDate = new Date(dateText);
                const timeParts = timeText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
                if (timeParts) {
                  let hours = parseInt(timeParts[1]);
                  const minutes = parseInt(timeParts[2]);
                  const ampm = timeParts[3]?.toLowerCase();

                  if (ampm === 'pm' && hours !== 12) hours += 12;
                  if (ampm === 'am' && hours === 12) hours = 0;

                  eventDate.setHours(hours, minutes, 0, 0);
                }
                
                // Check if it's a future event
                const now = new Date();
                const isFuture = eventDate > now;
                console.log(`  Parsed Date: ${eventDate}`);
                console.log(`  Is Future: ${isFuture}`);
                
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
                  console.log(`  ✅ Added to results!`);
                } else {
                  console.log(`  ❌ Skipped - past event`);
                }
                
                console.log('');
                break;
              } else {
                console.log(`  No date match found`);
              }
            }
            
            $current = $current.next();
          }
        }
      }
    });
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total events found: ${events.length}`);
    
    events.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Date: ${event.date.toDateString()} at ${event.time}`);
      console.log(`   Location: ${event.location}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

testFixedWetaskiwinScraper();
