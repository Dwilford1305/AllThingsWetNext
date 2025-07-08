import { NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import { Business } from '../../../../models'

export async function GET() {
  try {
    await connectDB()

    // Get all businesses and check for similar names
    const allBusinesses = await Business.find({}).sort({ name: 1 })
    console.log(`Analyzing ${allBusinesses.length} businesses for duplicates...`)

    const duplicatePatterns = new Map<string, unknown[]>()
    
    // Group by very similar names (ignoring contact names at the end)
    for (const business of allBusinesses) {
      // Remove common business suffixes and contact names
      let baseName = business.name.toLowerCase()
        .replace(/\b(ltd|inc|corp|co|llc|limited|incorporated|corporation|company)\b\.?/g, '')
        .replace(/\b(ken|steven|colleen|shanina|dan|dgy|curtis|adam|joe|aaron|michael|gary|alexie|alysia|tammy|paul|mike|andy|tina|al|anthony|kathleen|ashok|sarah|terrence|chuck|emmanuel|manny|brett|sandra|harley|hazen|brad|jason|wayne|rodney|bert|kent|susan|harsimran|darvin|tyler|brittany|larry|angel|pam|maureen|harpreet|long|dana|richard|pinky|hans|blaine|david|scott|doreen|colleen|leon|stephen|steven|jon|andrea|joanna|gail|jordan|tim|ana|faiz|john|george|ghazanfar|jim|jerry|brent|sharlene|esther|al|g|paul|simon|jeff|grace|don|loretta|alton|jessica|vanessa|abraham|bhesker|roxanne|jennifer|arsalam|jesse|craig|clayton|sidor|brentyn|maricel|laszlo|dale|gary|sherill|marg|jason|courtney|dan|wayne|sherri|brett|daniel|lorrie|arun|donna|doug|lambert|rob|patrick|cash|ruben|ed|diane|emily|kirk|amanda|paige|sarah|michael|peter|jeff|donald|ed|rene|ken|harvey|john|dean|ivan|stacey|laurelle|tiran|christia|sheila|dave|jane|byron|george|darcy|shawna|gordie|teresa|jason|sandy|jamie|greg|randal|mary|anne|karrim|marshall|karen|holly|nelly|michael|helen|pam|cory|cara|andy|marco|jessica|reg|byron|randy|belle|gail|sandy|arthur|paul|roselyn|donovan|peter|roxanne|irene|irv|steve|jeff|marilynn|john|janaka|apple|mark|joe|rico|jordan|juanita|bill|glen|ken|kenneth|ed|jay|karin|don|randy|teri|kirk|krysta|kris|sharlene|kyle|shawn|theresa|alan|jody|blair|lenard|aj|janet|shayam|genevie|harry|karen|marie|bruce|jiaming|frank|manfred|rick|pat|vanessa|mary|chris|michelle|yvonne|john|sam|mark|michael|anthony|diana|jessie|mike|cheryl|brendan|bart|moe|harold|camie|ronald|kay|rick|sharon|nelia|jocel|claire|garry|quyen|peter|ross|randy|wade|ken|norm|ravi|terry|william|brent|lee|ruth|yvonne|cliff|lindsay|kirsten|ketan|christina|ron|james|tim|ron|gord|barbara|robert|lyle|tyson|tim|wing|werner|john|cam|sanjeen)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      // Remove leading numbers and normalize
      baseName = baseName.replace(/^\d+\s*/, '').trim()
      
      if (baseName.length < 2) continue
      
      if (!duplicatePatterns.has(baseName)) {
        duplicatePatterns.set(baseName, [])
      }
      duplicatePatterns.get(baseName)!.push(business)
    }

    // Find groups with duplicates
    const duplicates = []
    for (const [baseName, businesses] of duplicatePatterns) {
      if (businesses.length > 1) {
        duplicates.push({
          baseName,
          count: businesses.length,
          businesses: businesses.map(b => ({
          id: (b as { _id: string })._id,
          name: (b as { name: string }).name,
          address: (b as { address: string }).address,
          contact: (b as { contact: string }).contact
          }))
        })
      }
    }

    // Sort by most duplicates first
    duplicates.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      duplicates: duplicates.slice(0, 20), // Show top 20 duplicate groups
      totalDuplicateGroups: duplicates.length,
      totalBusinesses: allBusinesses.length
    })

  } catch (error) {
    console.error('Error analyzing duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
