const { MongoClient } = require('mongodb');

async function checkBusinessNames() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/allthingswetaskiwin');
  
  try {
    await client.connect();
    const db = client.db('allthingswetaskiwin');
    const businesses = await db.collection('businesses').find({}).limit(10).toArray();
    
    console.log('Sample businesses from database:');
    businesses.forEach((business, index) => {
      console.log(`${index + 1}. Name: "${business.name}"`);
      console.log(`   Contact: "${business.contact || 'N/A'}"`);
      console.log(`   ID: ${business.id}`);
      console.log('---');
    });
    
    // Check for businesses with contact names in the name field
    const businessesWithContactInName = await db.collection('businesses').find({
      $or: [
        { name: /\b(Steven|Michael|John|Sarah|Dan|Larry|Brent|Gary|Joe|Ken|Aaron|Adam|Shannon|Colleen|Dave|Rick|Tom|Mike|Chris|Paul|Mark|Steve|Bob|Jim|Bill|Jeff|Matt|Ryan|Kevin|Scott|David|Robert|James|William|Richard|Charles|Joseph|Thomas|Daniel|Matthew|Anthony|Donald|Mark|Paul|Steven|Kenneth|Joshua|Kevin|Brian|George|Edward|Ronald|Timothy|Jason|Jeffrey|Ryan|Jacob|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Gregory|Alexander|Patrick|Frank|Raymond|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Henry|Adam|Douglas|Nathan|Peter|Zachary|Kyle|Walter|Harold|Carl|Jeremy|Arthur|Lawrence|Sean|Christian|Ethan|Austin|Albert|Mason|Noah|Hunter|Joe|Dan|Larry|Brent|Gary|Joe|Ken|Aaron|Adam|Shannon|Colleen|Dave|Rick|Tom|Mike|Chris|Paul|Mark|Steve|Bob|Jim|Bill|Jeff|Matt|Ryan|Kevin|Scott|David|Robert|James|William|Richard|Charles|Joseph|Thomas|Daniel|Matthew|Anthony|Donald|Mark|Paul|Steven|Kenneth|Joshua|Kevin|Brian|George|Edward|Ronald|Timothy|Jason|Jeffrey|Ryan|Jacob|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Gregory|Alexander|Patrick|Frank|Raymond|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Henry|Adam|Douglas|Nathan|Peter|Zachary|Kyle|Walter|Harold|Carl|Jeremy|Arthur|Lawrence|Sean|Christian|Ethan|Austin|Albert|Mason|Noah|Hunter)\b/i }
      ]
    }).toArray();
    
    console.log(`\nFound ${businessesWithContactInName.length} businesses with potential contact names in business name:`);
    businessesWithContactInName.slice(0, 5).forEach((business, index) => {
      console.log(`${index + 1}. "${business.name}" (contact: "${business.contact || 'N/A'}")`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkBusinessNames();
