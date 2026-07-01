const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  // Section A: Encrypted Internal Identity (Internal Eyes Only)
  internalId: { type: String, required: true, unique: true }, // e.g., VNG-89422
  legalName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  whatsapp: { type: String, required: true },
  instagramHandle: { type: String, required: true }, // Only visible to internal operations

  // Section B: Public Technical Meta
  primaryRole: { 
    type: String, 
    required: true, 
    enum: ['Talent', 'DP', 'Editor', 'Drone', 'Writer'] 
  },
  niches: [{ type: String }],
  gearSetup: { type: String, required: true },
  location: { type: String, required: true },
  portfolioUrl: { type: String, required: true },

  // Section C: System Score Metrics
  universalScoreBaseline: { type: Number, default: 500 }, // Standard starting base
  apiMetrics: {
    followerCount: { type: Number, default: 0 },
    avgEngagementRate: { type: Number, default: 0.0 },
    isVerifiedBusiness: { type: Boolean, default: false }
  },
  
  // Status Handling
  applicationStatus: { 
    type: String, 
    default: 'Pending_API_Review', 
    enum: ['Pending_API_Review', 'Vetted', 'Rejected'] 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
