const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Application = require('../models/Application');

// Helper to simulate Meta Graph API processing in background
async function triggerMetaGraphProcessing(applicationId, instagramHandle) {
  console.log(`[SYSTEM] Initiating background Meta Graph processing for handle: ${instagramHandle} (ID: ${applicationId})`);
  
  // In a real environment, we would make a request to:
  // https://graph.facebook.com/v20.0/instagram_business_account...
  // using process.env.META_GRAPH_ACCESS_TOKEN.
  
  // Simulate network latency (2 seconds)
  setTimeout(async () => {
    try {
      // Generate realistic metrics based on handle/random for demo purposes
      const mockFollowers = Math.floor(Math.random() * 85000) + 15000; // 15k - 100k
      const mockEngagement = parseFloat((Math.random() * 6.5 + 1.5).toFixed(2)); // 1.5% - 8%
      const mockVerified = Math.random() > 0.5;
      
      // Calculate Universal Score Baseline based on metrics
      // Base: 300
      // Followers contribution: up to 300 pts (max at 100k)
      // Engagement contribution: up to 300 pts (max at 8%)
      // Business verification bonus: 100 pts
      const followerPts = Math.min(Math.floor((mockFollowers / 100000) * 300), 300);
      const engagementPts = Math.min(Math.floor((mockEngagement / 8) * 300), 300);
      const verifiedPts = mockVerified ? 100 : 0;
      
      const calculatedScore = 300 + followerPts + engagementPts + verifiedPts;
      
      const status = calculatedScore >= 700 ? 'Vetted' : 'Pending_API_Review';
      
      await Application.findOneAndUpdate(
        { internalId: applicationId },
        { 
          'apiMetrics.followerCount': mockFollowers,
          'apiMetrics.avgEngagementRate': mockEngagement,
          'apiMetrics.isVerifiedBusiness': mockVerified,
          universalScoreBaseline: calculatedScore,
          applicationStatus: status
        }
      );
      
      console.log(`[SYSTEM] Meta Graph processing complete for ID ${applicationId}:`);
      console.log(`  - Followers: ${mockFollowers}`);
      console.log(`  - Engagement: ${mockEngagement}%`);
      console.log(`  - Verified Business: ${mockVerified}`);
      console.log(`  - Assigned Universal Score: ${calculatedScore}`);
      console.log(`  - Application Status: ${status}`);

      // Try sending confirmation email with the calculation results
      await sendEmailConfirmation(applicationId, mockFollowers, mockEngagement, calculatedScore);
    } catch (err) {
      console.error(`[SYSTEM ERROR] Failed updating application metrics for ID ${applicationId}:`, err);
    }
  }, 2000);
}

// Helper to simulate/send email confirmation via Resend / SendGrid
async function sendEmailConfirmation(applicationId, followers, engagement, score) {
  try {
    const app = await Application.findOne({ internalId: applicationId });
    if (!app) return;

    const emailSubject = `[VANGUARD] Application Processed - ID: ${applicationId}`;
    const emailBody = `
=========================================
VANGUARD COHORT 1 ONBOARDING NOTIFICATION
=========================================

Dear ${app.legalName},

Your application for evaluation under blind-ID [${applicationId}] has been successfully processed by the Vanguard Council database.

Our Meta Graph API script has completed analyzing your professional channel (${app.instagramHandle}) data:

Metrics Summary:
-----------------------------------------
- Instagram Handle: ${app.instagramHandle}
- Verified Business Account: ${app.apiMetrics.isVerifiedBusiness ? 'Yes' : 'No'}
- Profile Audience Count: ${followers.toLocaleString()}
- Average Media Engagement: ${engagement}%
- Computed Universal Score Baseline: ${score} / 1000

Status:
-----------------------------------------
Your current profile tier: ${score >= 700 ? 'Vanguard Elite Operators' : 'Accredited Operator Pending Council Review'}
Your application status is: ${app.applicationStatus}

In line with our double-blind governance rules, your legal identity, face, and WhatsApp number (${app.whatsapp}) have been scrubbed and fully encrypted. Hiring clients will only see your blind-ID [${applicationId}], your role [${app.primaryRole}], your location [${app.location}], and your dynamic score stats.

Should you qualify for active campaigns, our regional smart contract will notify you to finalize the milestone escrow agreement.

Sincerely,
The Vanguard Onboarding Engine
    `;

    console.log(`\n--- OUTGOING SECURE EMAIL SYSTEM SIMULATION ---`);
    console.log(`To: ${app.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(emailBody);
    console.log(`------------------------------------------------\n`);

    // If RESEND_API_KEY is configured in .env, we could easily perform:
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });
  } catch (err) {
    console.error(`[SYSTEM ERROR] Email engine failed for ID ${applicationId}:`, err);
  }
}

// POST /api/v1/apply
router.post('/apply', async (req, res) => {
  try {
    const { 
      legalName, 
      email, 
      whatsapp, 
      instagramHandle, 
      primaryRole, 
      niches, 
      gearSetup, 
      location, 
      portfolioUrl 
    } = req.body;

    // Validate inputs
    if (!legalName || !email || !whatsapp || !instagramHandle || !primaryRole || !gearSetup || !location || !portfolioUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "All mandatory application fields must be completed." 
      });
    }

    // 1. Check if email already applied to prevent spam
    const existingApp = await Application.findOne({ email });
    if (existingApp) {
      return res.status(400).json({ 
        success: false, 
        message: "This email address is already registered in our system." 
      });
    }

    // 2. Generate a completely blind, random marketplace ID
    const blindId = `VNG-${crypto.randomInt(10000, 99999)}`;

    // 3. Create entry in MongoDB
    const newApplication = new Application({
      internalId: blindId,
      legalName,
      email,
      whatsapp,
      instagramHandle,
      primaryRole,
      niches: niches || [],
      gearSetup,
      location,
      portfolioUrl
    });

    await newApplication.save();

    // 4. Trigger background task to call Meta API and process profile stats
    triggerMetaGraphProcessing(blindId, instagramHandle);

    return res.status(201).json({
      success: true,
      message: "Application logged securely.",
      assignedId: blindId
    });

  } catch (error) {
    console.error("System Core Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server entry failure. Please check database connectivity." 
    });
  }
});

// GET /api/v1/applications (For testing & local preview purposes - returns anonymized profiles only)
router.get('/applications', async (req, res) => {
  try {
    // Exclude PII (legalName, email, whatsapp, instagramHandle) to respect the double-blind structure
    const applications = await Application.find({}, {
      internalId: 1,
      primaryRole: 1,
      niches: 1,
      gearSetup: 1,
      location: 1,
      portfolioUrl: 1,
      universalScoreBaseline: 1,
      apiMetrics: 1,
      applicationStatus: 1,
      createdAt: 1
    });
    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve public cohort data." });
  }
});

module.exports = router;
