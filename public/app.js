document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. UNIVERSAL SCORE METER SANDBOX DYNAMICS
  // ==========================================
  const sliderFollowers = document.getElementById('slider-followers');
  const sliderEngagement = document.getElementById('slider-engagement');
  const checkVerified = document.getElementById('check-verified');
  
  const valFollowers = document.getElementById('val-followers');
  const valEngagement = document.getElementById('val-engagement');
  const liveScoreLabel = document.getElementById('live-score');
  const dialProgress = document.getElementById('dial-progress');
  
  const tierUnverified = document.getElementById('tier-unverified');
  const tierAccredited = document.getElementById('tier-accredited');
  const tierVanguard = document.getElementById('tier-vanguard');

  function formatFollowersCount(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'k';
    }
    return count;
  }

  function updateScoreMeter() {
    const followers = parseInt(sliderFollowers.value, 10);
    const engagement = parseFloat(sliderEngagement.value);
    const isVerified = checkVerified.checked;

    // Display formatted values in UI controls
    valFollowers.textContent = formatFollowersCount(followers);
    valEngagement.textContent = engagement.toFixed(1) + '%';

    // Core formula: Base 300 + Followers (up to 300 pts) + Engagement (up to 300 pts) + Business verification bonus (100 pts)
    // Followers points: Max at 250k followers
    const followerPts = Math.min((followers / 250000) * 300, 300);
    // Engagement points: Max at 15% engagement
    const engagementPts = Math.min((engagement / 15) * 300, 300);
    const verifiedPts = isVerified ? 100 : 0;

    const totalScore = Math.round(300 + followerPts + engagementPts + verifiedPts);
    
    // Animate score counter text
    animateScoreCounter(parseInt(liveScoreLabel.textContent, 10) || 500, totalScore);

    // Update Circular Dial Progress Arc
    // Dasharray is 380. Dashoffset 380 is empty, 0 is full.
    // However, the progress stroke is a semi-circle, so we scale it.
    const dashOffset = 380 - (totalScore / 1000) * 380;
    dialProgress.style.strokeDashoffset = dashOffset;

    // Update highlights on tier list
    tierUnverified.classList.remove('active-tier');
    tierAccredited.classList.remove('active-tier');
    tierVanguard.classList.remove('active-tier');

    if (totalScore < 400) {
      tierUnverified.classList.add('active-tier');
    } else if (totalScore >= 400 && totalScore < 700) {
      tierAccredited.classList.add('active-tier');
    } else {
      tierVanguard.classList.add('active-tier');
    }
  }

  function animateScoreCounter(start, end) {
    if (start === end) return;
    const duration = 400; // ms
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * easeProgress);
      
      liveScoreLabel.textContent = currentVal;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        liveScoreLabel.textContent = end;
      }
    }
    requestAnimationFrame(updateCounter);
  }

  // Bind events for score sandbox
  if (sliderFollowers && sliderEngagement && checkVerified) {
    sliderFollowers.addEventListener('input', updateScoreMeter);
    sliderEngagement.addEventListener('input', updateScoreMeter);
    checkVerified.addEventListener('change', updateScoreMeter);
    
    // Initial run
    updateScoreMeter();
  }

  // ==========================================
  // 2. SMOOTH SCROLL FOR INVITE CTA
  // ==========================================
  const ctaBtn = document.getElementById('cta-btn-apply');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const applySection = document.getElementById('apply-now');
      if (applySection) {
        applySection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ==========================================
  // 3. MULTI-STEP FORM LOGIC
  // ==========================================
  const form = document.getElementById('onboarding-form');
  const formCard = document.getElementById('form-card');
  const successCard = document.getElementById('success-card');
  const successIdLabel = document.getElementById('success-assigned-id');
  const errorBanner = document.getElementById('form-error-banner');
  const resetBtn = document.getElementById('btn-reset-form');

  // Form Steps
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');

  // Dots
  const dot1 = document.getElementById('step-dot-1');
  const dot2 = document.getElementById('step-dot-2');
  const dot3 = document.getElementById('step-dot-3');

  // Navigation buttons
  const toStep2Btn = document.getElementById('btn-to-step2');
  const toStep3Btn = document.getElementById('btn-to-step3');
  const backToStep1Btn = document.getElementById('btn-back-to-step1');
  const backToStep2Btn = document.getElementById('btn-back-to-step2');
  const submitBtn = document.getElementById('btn-submit-form');

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateInput(inputElement, errorElement) {
    if (!inputElement.value.trim()) {
      inputElement.classList.add('invalid-field');
      errorElement.classList.add('visible');
      return false;
    }
    
    if (inputElement.type === 'email' && !emailRegex.test(inputElement.value.trim())) {
      inputElement.classList.add('invalid-field');
      errorElement.textContent = "Please enter a valid email format.";
      errorElement.classList.add('visible');
      return false;
    }

    inputElement.classList.remove('invalid-field');
    errorElement.classList.remove('visible');
    return true;
  }

  // Handle inputs typing state reset error
  const inputs = form.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid-field');
      const errEl = document.getElementById(`err-${input.id}`);
      if (errEl) errEl.classList.remove('visible');
      if (errorBanner) errorBanner.style.display = 'none';
    });
  });

  // Step 1 Validation & Proceed
  toStep2Btn.addEventListener('click', () => {
    const legalName = document.getElementById('legalName');
    const email = document.getElementById('email');
    const whatsapp = document.getElementById('whatsapp');

    const errName = document.getElementById('err-legalName');
    const errEmail = document.getElementById('err-email');
    const errWhatsapp = document.getElementById('err-whatsapp');

    const isNameValid = validateInput(legalName, errName);
    const isEmailValid = validateInput(email, errEmail);
    const isWhatsappValid = validateInput(whatsapp, errWhatsapp);

    if (isNameValid && isEmailValid && isWhatsappValid) {
      // Transition CSS view
      step1.classList.remove('active-step');
      step2.classList.add('active-step');

      // Update Stepper dots indicators
      dot1.classList.add('complete');
      dot2.classList.add('active');
    }
  });

  // Step 2 Validation & Proceed
  toStep3Btn.addEventListener('click', () => {
    const primaryRole = document.getElementById('primaryRole');
    const gearSetup = document.getElementById('gearSetup');
    const location = document.getElementById('location');

    const errRole = document.getElementById('err-primaryRole');
    const errGear = document.getElementById('err-gearSetup');
    const errLocation = document.getElementById('err-location');

    const isRoleValid = validateInput(primaryRole, errRole);
    const isGearValid = validateInput(gearSetup, errGear);
    const isLocationValid = validateInput(location, errLocation);

    if (isRoleValid && isGearValid && isLocationValid) {
      step2.classList.remove('active-step');
      step3.classList.add('active-step');

      dot2.classList.add('complete');
      dot3.classList.add('active');
    }
  });

  // Back Navigation
  backToStep1Btn.addEventListener('click', () => {
    step2.classList.remove('active-step');
    step1.classList.add('active-step');

    dot1.classList.remove('complete');
    dot2.classList.remove('active');
  });

  backToStep2Btn.addEventListener('click', () => {
    step3.classList.remove('active-step');
    step2.classList.add('active-step');

    dot2.classList.remove('complete');
    dot3.classList.remove('active');
  });

  // ==========================================
  // 4. API FORM SUBMISSION
  // ==========================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const instagramHandle = document.getElementById('instagramHandle');
    const portfolioUrl = document.getElementById('portfolioUrl');

    const errInstagram = document.getElementById('err-instagramHandle');
    const errPortfolio = document.getElementById('err-portfolioUrl');

    const isInstaValid = validateInput(instagramHandle, errInstagram);
    const isPortfolioValid = validateInput(portfolioUrl, errPortfolio);

    if (!isInstaValid || !isPortfolioValid) return;

    // Gather niche checkboxes data
    const niches = [];
    const checkedNiches = form.querySelectorAll('input[name="niches"]:checked');
    checkedNiches.forEach(chk => {
      niches.push(chk.value);
    });

    // Package data payload
    const payload = {
      legalName: document.getElementById('legalName').value.trim(),
      email: document.getElementById('email').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      primaryRole: document.getElementById('primaryRole').value,
      niches: niches,
      gearSetup: document.getElementById('gearSetup').value.trim(),
      location: document.getElementById('location').value.trim(),
      instagramHandle: instagramHandle.value.trim(),
      portfolioUrl: portfolioUrl.value.trim()
    };

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Securing Identity & Logging Entry...";
    errorBanner.style.display = 'none';

    try {
      const response = await fetch('/api/v1/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        successIdLabel.textContent = data.assignedId;
        
        // Toggle view cards
        formCard.style.display = 'none';
        successCard.style.display = 'block';

        // Smooth scroll to top of onboarding section so confirmation is visible
        document.getElementById('apply-now').scrollIntoView({ behavior: 'smooth' });
      } else {
        // Validation/System Error returned from Server API
        errorBanner.textContent = data.message || "Failure logging registration. Please check inputs.";
        errorBanner.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = "Finalize Application for Council Review";
      }
    } catch (err) {
      console.error("Submission fetch failed:", err);
      errorBanner.textContent = "Server Connection Offline. Verify server is running locally or check network.";
      errorBanner.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = "Finalize Application for Council Review";
    }
  });

  // Reset form card back to step 1
  resetBtn.addEventListener('click', () => {
    form.reset();
    
    // Reset stepper UI states
    dot1.className = 'step-indicator active';
    dot2.className = 'step-indicator';
    dot3.className = 'step-indicator';

    step3.classList.remove('active-step');
    step1.classList.add('active-step');

    successCard.style.display = 'none';
    formCard.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Finalize Application for Council Review";
  });

});
