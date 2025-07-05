const axios = require('axios');

async function checkEvents() {
  try {
    const response = await axios.get('http://localhost:3000/api/events');
    const events = response.data.data;
    
    console.log(`\nTotal events: ${events.length}`);
    
    // Group by source
    const bySource = events.reduce((acc, event) => {
      acc[event.sourceName] = (acc[event.sourceName] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEvents by source:');
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
    
    console.log('\nRecent events:');
    events.slice(0, 8).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.sourceName}) - ${event.time}`);
    });
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

checkEvents();
