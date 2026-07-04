document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('onboarding-form');
  const formCard = document.getElementById('form-card');
  const successCard = document.getElementById('success-card');
  const successIdLabel = document.getElementById('success-assigned-id');
  const errorBanner = document.getElementById('form-error-banner');
  const submitBtn = document.getElementById('btn-submit-form');
  
  // Sync Status Indicator Elements
  const syncStatusIndicator = document.getElementById('sync-status');
  const syncStatusText = syncStatusIndicator.querySelector('.sync-text');

  // Input fields
  const legalNameInput = document.getElementById('legalName');
  const emailInput = document.getElementById('email');
  const whatsappInput = document.getElementById('whatsapp');
  const primaryRoleSelect = document.getElementById('primaryRole');
  const gearSetupInput = document.getElementById('gearSetup');
  const locationInput = document.getElementById('location');
  const instagramHandleInput = document.getElementById('instagramHandle');
  const portfolioUrlInput = document.getElementById('portfolioUrl');

  // Team Referral Elements
  const isTeamApplicationCb = document.getElementById('isTeamApplication');
  const conditionalTeamFields = document.getElementById('conditionalTeamFields');
  const teamMemberIdentifierInput = document.getElementById('teamMemberIdentifier');
  const teamReferralVal = document.getElementById('teamReferralVal');

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Debounce timeout tracker
  let autosaveTimeout = null;

  // Retrieve assigned draft ID from local storage if it exists
  let localAssignedId = localStorage.getItem('vanguard_assigned_id');

  // Set initial sync state description if a draft exists
  if (localAssignedId) {
    setSyncState('saved', `Resumed draft session [${localAssignedId}]`);
  }

  // Generate dynamic active operators count (> 500)
  const statusOperatorCountEl = document.getElementById('status-operator-count');
  if (statusOperatorCountEl) {
    const randomCount = Math.floor(Math.random() * 200) + 501; // 501 - 700
    statusOperatorCountEl.textContent = `${randomCount} Active Operators`;
  }

  // ==========================================
  // CUSTOM DROP-DOWN DROPDOWN LOGIC
  // ==========================================
  const customRoleWrapper = document.getElementById('customRoleWrapper');
  const customRoleTrigger = document.getElementById('customRoleTrigger');
  const customRoleValue = customRoleTrigger.querySelector('.custom-select-value');
  const customRoleOptions = document.getElementById('customRoleOptions');
  const customOptions = customRoleOptions.querySelectorAll('.custom-option');

  // Toggle dropdown on trigger click
  customRoleTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customRoleWrapper.classList.contains('open');
    if (isOpen) {
      closeCustomSelect();
    } else {
      openCustomSelect();
    }
  });

  function openCustomSelect() {
    customRoleWrapper.classList.add('open');
    customRoleOptions.style.display = 'block';
  }

  function closeCustomSelect() {
    customRoleWrapper.classList.remove('open');
    customRoleOptions.style.display = 'none';
  }

  // Handle option selection
  customOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.getAttribute('data-value');
      const text = opt.textContent;

      // Update native select value
      primaryRoleSelect.value = val;
      
      // Update custom UI
      customRoleValue.textContent = text;
      customRoleValue.classList.add('selected');
      customRoleTrigger.classList.remove('invalid-field');

      // Update selected state in option elements
      customOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      // Trigger change event to fire autosaves and validation checks
      primaryRoleSelect.dispatchEvent(new Event('change'));

      closeCustomSelect();
    });
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    closeCustomSelect();
  });

  // Sync custom dropdown with native select
  function syncCustomSelect() {
    const selectedVal = primaryRoleSelect.value;
    if (selectedVal) {
      const matchingOpt = Array.from(customOptions).find(o => o.getAttribute('data-value') === selectedVal);
      if (matchingOpt) {
        customRoleValue.textContent = matchingOpt.textContent;
        customRoleValue.classList.add('selected');
        customOptions.forEach(o => o.classList.remove('selected'));
        matchingOpt.classList.add('selected');
      }
    } else {
      customRoleValue.textContent = "Select your core role...";
      customRoleValue.classList.remove('selected');
      customOptions.forEach(o => o.classList.remove('selected'));
    }
  }

  // Initial sync (handles autocompletion / page refreshes)
  syncCustomSelect();

  // ==========================================
  // SYNC INDICATOR STATE CONTROL
  // ==========================================
  function setSyncState(state, message) {
    syncStatusIndicator.className = 'sync-indicator'; // clear classes
    
    if (state === 'syncing') {
      syncStatusIndicator.classList.add('syncing');
      syncStatusText.textContent = message || 'Syncing draft changes...';
    } else if (state === 'saved') {
      syncStatusIndicator.classList.add('saved');
      syncStatusText.textContent = message || 'Changes saved in database.';
    } else if (state === 'error') {
      syncStatusIndicator.classList.add('error');
      syncStatusText.textContent = message || 'Failed to auto-sync updates.';
    } else {
      syncStatusText.textContent = message || 'Form updates will sync automatically...';
    }
  }

  // ==========================================
  // LEAD ABANDONMENT BACKGROUND SYNC (AUTOSAVE)
  // ==========================================
  async function performAutosave() {
    const emailValue = emailInput.value.trim();
    
    // We only initialize autosave once a valid email is inputted.
    // This maps the draft to a specific identity to avoid empty database keys.
    if (!emailRegex.test(emailValue)) {
      return;
    }

    setSyncState('syncing', 'Syncing changes...');

    // Gather checked niches
    const niches = [];
    const checkedNiches = form.querySelectorAll('input[name="niches"]:checked');
    checkedNiches.forEach(chk => {
      niches.push(chk.value);
    });

    // Package partial form data
    const payload = {
      assignedId: localAssignedId || undefined,
      email: emailValue,
      legalName: legalNameInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      instagramHandle: instagramHandleInput.value.trim(),
      primaryRole: primaryRoleSelect.value || undefined,
      niches: niches,
      gearSetup: gearSetupInput.value.trim(),
      location: locationInput.value.trim(),
      portfolioUrl: portfolioUrlInput.value.trim(),
      isTeamApplication: isTeamApplicationCb.checked,
      teamMemberIdentifier: teamMemberIdentifierInput.value.trim()
    };

    try {
      const response = await fetch('/api/v1/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save/Update the draft ID in local storage
        if (data.assignedId) {
          localAssignedId = data.assignedId;
          localStorage.setItem('vanguard_assigned_id', data.assignedId);
          setSyncState('saved', `Draft progress saved: ${data.assignedId}`);
        } else {
          setSyncState('saved');
        }
      } else {
        setSyncState('error', data.message || 'Auto-save skipped.');
      }
    } catch (err) {
      console.warn('Autosave network error:', err);
      setSyncState('error', 'Network offline. Saving locally...');
    }
  }

  // Trigger debounced autosave
  function triggerAutosaveDebounce() {
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    // Check if email has been entered first before debouncing
    if (emailRegex.test(emailInput.value.trim())) {
      setSyncState('syncing', 'Typing detected...');
      autosaveTimeout = setTimeout(performAutosave, 1500); // 1.5 seconds debounce
    }
  }

  // ==========================================
  // INPUT EVENT BINDINGS
  // ==========================================
  const inputsToTrack = [
    legalNameInput,
    emailInput,
    whatsappInput,
    gearSetupInput,
    locationInput,
    instagramHandleInput,
    portfolioUrlInput,
    teamMemberIdentifierInput
  ];

  // Track team checkbox state and update button copy / priority badge
  if (isTeamApplicationCb) {
    isTeamApplicationCb.addEventListener('change', () => {
      const isChecked = isTeamApplicationCb.checked;
      const chanceBadge = document.getElementById('chance-badge');
      const chanceVal = document.getElementById('selection-chance-val');
      
      conditionalTeamFields.style.display = isChecked ? 'block' : 'none';
      
      if (isChecked) {
        if (chanceBadge) chanceBadge.classList.add('boosted');
        if (chanceVal) {
          chanceVal.classList.add('boosted');
          chanceVal.textContent = '+70% Priority Selection Boost';
        }
        submitBtn.textContent = '⚡ Submit and Upgrade to Team Status';
      } else {
        if (chanceBadge) chanceBadge.classList.remove('boosted');
        if (chanceVal) {
          chanceVal.classList.remove('boosted');
          chanceVal.textContent = 'Normal';
        }
        submitBtn.textContent = 'Submit Application to Vanguard Council';
        teamMemberIdentifierInput.value = '';
        updateReferralNamePreview();
      }
      performAutosave(); // Immediate save on toggle
    });
  }

  // Update referral name preview text helper
  function updateReferralNamePreview() {
    if (teamReferralVal) {
      const name = legalNameInput.value.trim();
      teamReferralVal.textContent = name || '[Your Name]';
    }
  }

  // Bind name input to update invite note preview
  legalNameInput.addEventListener('input', () => {
    updateReferralNamePreview();
  });

  // Run initial sync of referral preview
  updateReferralNamePreview();

  inputsToTrack.forEach(input => {
    input.addEventListener('input', () => {
      // Clear individual error highlights on typing
      input.classList.remove('invalid-field');
      const errEl = document.getElementById(`err-${input.id}`);
      if (errEl) errEl.classList.remove('visible');
      if (errorBanner) errorBanner.style.display = 'none';
      
      triggerAutosaveDebounce();
    });
  });

  // Track select dropdown updates
  primaryRoleSelect.addEventListener('change', () => {
    primaryRoleSelect.classList.remove('invalid-field');
    const errEl = document.getElementById(`err-${primaryRoleSelect.id}`);
    if (errEl) errEl.classList.remove('visible');
    
    performAutosave(); // Immediate save on select
  });

  // Track niche checkboxes updates
  const nicheCheckboxes = form.querySelectorAll('input[name="niches"]');
  nicheCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      performAutosave(); // Immediate save on checkbox toggling
    });
  });

  // ==========================================
  // FORM VALIDATION & SUBMISSION
  // ==========================================
  function validateField(inputElement, errorElement) {
    if (!inputElement.value.trim()) {
      inputElement.classList.add('invalid-field');
      if (inputElement.id === 'primaryRole') {
        const trig = document.getElementById('customRoleTrigger');
        if (trig) trig.classList.add('invalid-field');
      }
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
    if (inputElement.id === 'primaryRole') {
      const trig = document.getElementById('customRoleTrigger');
      if (trig) trig.classList.remove('invalid-field');
    }
    errorElement.classList.remove('visible');
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Perform validation on all inputs for final submission
    const isNameValid = validateField(legalNameInput, document.getElementById('err-legalName'));
    const isEmailValid = validateField(emailInput, document.getElementById('err-email'));
    const isWhatsappValid = validateField(whatsappInput, document.getElementById('err-whatsapp'));
    const isRoleValid = validateField(primaryRoleSelect, document.getElementById('err-primaryRole'));
    const isLocationValid = validateField(locationInput, document.getElementById('err-location'));
    const isInstaValid = validateField(instagramHandleInput, document.getElementById('err-instagramHandle'));

    const isFormValid = isNameValid && isEmailValid && isWhatsappValid && isRoleValid && 
                        isLocationValid && isInstaValid;

    if (!isFormValid) {
      errorBanner.textContent = "Please fill in all mandatory application fields before submitting.";
      errorBanner.style.display = 'block';
      // Scroll to the error banner
      errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Cancel any pending debounced autosaves
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    // Gather checked niches
    const niches = [];
    const checkedNiches = form.querySelectorAll('input[name="niches"]:checked');
    checkedNiches.forEach(chk => {
      niches.push(chk.value);
    });

    // Package final data payload
    const payload = {
      assignedId: localAssignedId || undefined,
      legalName: legalNameInput.value.trim(),
      email: emailInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      primaryRole: primaryRoleSelect.value,
      niches: niches,
      gearSetup: gearSetupInput.value.trim(),
      location: locationInput.value.trim(),
      instagramHandle: instagramHandleInput.value.trim(),
      portfolioUrl: portfolioUrlInput.value.trim(),
      isTeamApplication: isTeamApplicationCb.checked,
      teamMemberIdentifier: teamMemberIdentifierInput.value.trim()
    };

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Locking Identity & Finalizing Evaluation...";
    errorBanner.style.display = 'none';
    setSyncState('syncing', 'Submitting final application...');

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
        // Clear local storage draft cache
        localStorage.removeItem('vanguard_assigned_id');
        localAssignedId = null;

        // Render Success Card
        successIdLabel.textContent = data.assignedId;
        formCard.style.display = 'none';
        successCard.style.display = 'block';

        // Scroll to success screen header
        document.querySelector('.form-pane').scrollIntoView({ behavior: 'smooth' });
      } else {
        errorBanner.textContent = data.message || "Failed to submit application. Verify inputs.";
        errorBanner.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = "Finalize Application for Council Review";
        setSyncState('error', 'Submission failed.');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      errorBanner.textContent = "Server Connection Offline. Verify server connectivity.";
      errorBanner.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = "Finalize Application for Council Review";
      setSyncState('error', 'Network offline during submit.');
    }
  });

});
