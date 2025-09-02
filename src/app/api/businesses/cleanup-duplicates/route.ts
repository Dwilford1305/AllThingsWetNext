import { NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Business } from '../../../../models'

export async function POST() {
  try {
    console.log('Starting aggressive duplicate cleanup...')
    await connectDB()

    // Find all businesses and group by normalized base name
    const allBusinesses = await Business.find({}).sort({ name: 1 })
    console.log(`Found ${allBusinesses.length} total businesses`)

    const businessGroups = new Map<string, unknown[]>()
    
    // Group businesses by base name (removing contact names)
    for (const business of allBusinesses) {
      let baseName = business.name.toLowerCase()
        .replace(/\b(ltd|inc|corp|co|llc|limited|incorporated|corporation|company)\b\.?/g, '')
        .replace(/\b(ken|steven|colleen|shanina|dan|dgy|curtis|adam|joe|aaron|michael|gary|alexie|alysia|tammy|paul|mike|andy|tina|al|anthony|kathleen|ashok|sarah|terrence|chuck|emmanuel|manny|brett|sandra|harley|hazen|brad|jason|wayne|rodney|bert|kent|susan|harsimran|darvin|tyler|brittany|larry|angel|pam|maureen|harpreet|long|dana|richard|pinky|hans|blaine|david|scott|doreen|colleen|leon|stephen|steven|jon|andrea|joanna|gail|jordan|tim|ana|faiz|john|george|ghazanfar|jim|jerry|brent|sharlene|esther|al|g|paul|simon|jeff|grace|don|loretta|alton|jessica|vanessa|abraham|bhesker|roxanne|jennifer|arsalam|jesse|craig|clayton|sidor|brentyn|maricel|laszlo|dale|gary|sherill|marg|jason|courtney|dan|wayne|sherri|brett|daniel|lorrie|arun|donna|doug|lambert|rob|patrick|cash|ruben|ed|diane|emily|kirk|amanda|paige|sarah|michael|peter|jeff|donald|ed|rene|ken|harvey|john|dean|ivan|stacey|laurelle|tiran|christia|sheila|dave|jane|byron|george|darcy|shawna|gordie|teresa|jason|sandy|jamie|greg|randal|mary|anne|karrim|marshall|karen|holly|nelly|michael|helen|pam|cory|cara|andy|marco|jessica|reg|byron|randy|belle|gail|sandy|arthur|paul|roselyn|donovan|peter|roxanne|irene|irv|steve|jeff|marilynn|john|janaka|apple|mark|joe|rico|jordan|juanita|bill|glen|ken|kenneth|ed|jay|karin|don|randy|teri|kirk|krysta|kris|sharlene|kyle|shawn|theresa|alan|jody|blair|lenard|aj|janet|shayam|genevie|harry|karen|marie|bruce|jiaming|frank|manfred|rick|pat|vanessa|mary|chris|michelle|yvonne|john|sam|mark|michael|anthony|diana|jessie|mike|cheryl|brendan|bart|moe|harold|camie|ronald|kay|rick|sharon|nelia|jocel|claire|garry|quyen|peter|ross|randy|wade|ken|norm|ravi|terry|william|brent|lee|ruth|yvonne|cliff|lindsay|kirsten|ketan|christina|ron|james|tim|ron|gord|barbara|robert|lyle|tyson|tim|wing|werner|john|cam|sanjeen)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      // Remove leading numbers
      baseName = baseName.replace(/^\d+\s*/, '').trim()
      
      if (baseName.length < 2) continue
      
      if (!businessGroups.has(baseName)) {
        businessGroups.set(baseName, [])
      }
      businessGroups.get(baseName)!.push(business)
    }

    let duplicatesRemoved = 0
    const duplicateGroups: unknown[] = []

    // Process each group and keep only the best entry
    for (const [baseName, businesses] of businessGroups) {
      if (businesses.length > 1) {
        duplicateGroups.push({
          baseName,
          count: businesses.length,
          businesses: (businesses as { name: string; address: string; id: string }[]).map(b => ({ name: b.name, address: b.address, id: b.id }))
        })

        // Keep the business with the most complete information, preserving websites
        const bestBusiness = (businesses as Array<{ _id: { toString: () => string }; name: string; phone?: string; website?: string; contact?: string }>).reduce((best, current) => {
          // Score businesses based on available data
          const currentScore = (current.phone ? 1 : 0) + (current.website ? 2 : 0) + (current.contact ? 0.5 : 0);
          const bestScore = (best.phone ? 1 : 0) + (best.website ? 2 : 0) + (best.contact ? 0.5 : 0);
          
          if (currentScore > bestScore) return current;
          if (currentScore < bestScore) return best;
          
          // If scores are equal, prefer longer name or first one
          if (current.name.length > best.name.length) return current;
          return best;
        });

        // Before removing, merge website data from duplicates if the best one doesn't have it
        const businessesToRemove = (businesses as Array<{ _id: { toString: () => string }; name: string; website?: string; phone?: string }>)
          .filter(b => b._id && bestBusiness._id && b._id.toString() !== bestBusiness._id.toString());

        // Merge data from duplicates before removing them
        const mergeData: Record<string, unknown> = {};
        let hasUpdates = false;
        
        if (!bestBusiness.website) {
          for (const duplicate of businessesToRemove) {
            if (duplicate.website) {
              mergeData.website = duplicate.website;
              hasUpdates = true;
              break;
            }
          }
        }
        
        if (!bestBusiness.phone) {
          for (const duplicate of businessesToRemove) {
            if (duplicate.phone) {
              mergeData.phone = duplicate.phone;
              hasUpdates = true;
              break;
            }
          }
        }
        
        // Update the best business with merged data
        if (hasUpdates) {
          mergeData.updatedAt = new Date();
          await Business.findByIdAndUpdate(bestBusiness._id, mergeData);
          console.log(`Merged data into kept business: ${bestBusiness.name}`);
        }

        for (const business of businessesToRemove) {
          await Business.deleteOne({ _id: business._id });
          duplicatesRemoved++;
          console.log(`Removed duplicate: ${business.name}`);
        }
      }
    }

    const finalCount = await Business.countDocuments()
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${duplicatesRemoved} duplicates removed`,
      data: {
        duplicatesRemoved,
        duplicateGroups: duplicateGroups.slice(0, 10), // Show first 10 groups for reference
        finalCount,
        totalDuplicateGroups: duplicateGroups.length
      }
    })

  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
