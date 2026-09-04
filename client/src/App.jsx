import React, { useCallback, useEffect, useState } from "react";
import "./styles.css";

const serviceSubCategories = ["AR", "CG", "SFF", "TA", "GREF", "BRO"];
const applicantCategories = ["ESM", "Widow", "NOK", "EC", "WW Veteran", "SSC"];
const cardCategories = ["Officer", "JCO", "OR"];
const cardOptions = ["Liquor", "Grocery", "Dependent1", "Dependent2"];
const payLevels = ["Level 1 to 5", "Level 6 to 9", "Level 10 to 18"];

// Helper to get today's date in YYYY-MM-DD format
function getTodayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Date conversion & display helpers
function isoToDisplay(iso) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return iso;
}

// Local Storage Keys
const WIZARD_STORAGE_KEY = "canteenSmartCardWizard_v3";
const APP_NUMBER_SESSION_KEY = "oe_app_number";

// Server API endpoints — tried in order, first successful one wins.
// The server counter.json is the SINGLE authoritative source of application
// numbers. There is NO client-side fallback counter. If the server is
// unavailable, the user sees a clear error rather than silently generating
// a browser-local number that would break cross-browser sequence sharing.
const API_ENDPOINTS = [
  import.meta.env.VITE_API_URL,
  "http://localhost:5001/api",
  "http://127.0.0.1:5001/api",
].filter(Boolean);

/**
 * Fetch the next application number from the server.
 * Returns the formatted string (e.g. "OE-0000055") on success, or null if
 * every configured endpoint is unreachable within the given timeout.
 *
 * @param {number} [timeoutMs=3000]
 * @returns {Promise<string|null>}
 */
async function fetchNextApplicationNumber(timeoutMs = 3000) {
  for (const baseUrl of API_ENDPOINTS) {
    try {
      const res = await fetch(`${baseUrl}/applications/next-number`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const num = data.applicationNumber;
      if (num) return num;
    } catch {
      // Network error or timeout — try next endpoint
    }
  }
  return null; // All endpoints failed
}


const emptyForm = {
  applicationNumber: "",
  applicationType: "firstTime",
  applicationDate: getTodayIsoDate(),

  urcNo: "",
  urcName: "",

  service: "",
  serviceSubCategory: [],

  applicantCategory: "",

  cardCategory: "",
  cardApplied: [],
  payLevel: "",

  oldLiquorGroceryCardId: "",
  substantiveRank: "",
  personalNumber: "",
  fullName: "",

  dateOfBirth: "",
  panCardNumber: "",
  dateOfJoining: "",
  dateOfRetirement: "",

  ppoNumber: "",
  applicantMobile: "",
  email: "",

  gender: "",
  maritalStatus: "",

  fatherName: "",
  spouseNokName: "",

  // Permanent Address
  permanentAddress1: "",
  permanentAddress2: "",
  city: "",
  state: "",
  pin: "",
  telNo: "",

  // Dependent 1
  dependent1Name: "",
  dependent1Relation: "",
  dependent1Dob: "",

  // Dependent 2
  dependent2Name: "",
  dependent2Relation: "",
  dependent2Dob: "",

  // Receipt
  receiptAmount: "",
  receiptRank: "",
  receiptPersonalNumber: "",
  receiptName: "",
  receiptFor: "",
  receiptCardsAppliedFrom: "",
  receiptUrcCode: "",
  receiptCanteenName: "",
  receiptPaymentDoneVia: "",
  receiptCashInstrumentUtrNo: "",
  receiptDate: "",
  bankName: "",
  branch: "",
  receiptDateBottom: "",

  // Declaration
  declarationDate: "",

  // Verified & Countersigned
  countersignedDate: "",
};

export default function App() {
  const [form, setForm] = useState(emptyForm);

  // Wizard UI state
  // Steps: 1 = Welcome, 2 = Instructions, 3 = Date & Verify, 4 = URC/Service/Cards, 5 = Personal, 6 = Address, 7 = Dependents, 8 = Final Action
  const [wizardStep, setWizardStep] = useState(2);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  // Field validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Generate a simple CAPTCHA code
  const generateCaptcha = (len = 6) => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // unambiguous chars
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setCaptcha(out);
    setCaptchaInput("");
  };

  // Comprehensive Field validation logic
  const validateField = (field, value, allValues = form) => {
    switch (field) {
      case "captcha": {
        if (!captchaInput || !captchaInput.trim()) return "CAPTCHA code is required.";
        if (captcha.trim().toUpperCase() !== captchaInput.trim().toUpperCase()) {
          return "CAPTCHA code does not match. Please try again.";
        }
        return "";
      }
      case "urcNo": {
        if (!value || !value.trim()) return "URC No. is required.";
        if (!/^[A-Za-z0-9\-_]+$/.test(value.trim())) return "URC No. must be alphanumeric.";
        if (value.trim().length < 2) return "URC No. must be at least 2 characters.";
        return "";
      }
      case "urcName": {
        if (!value || !value.trim()) return "URC Name is required.";
        if (!/^[A-Za-z0-9\s.&'-]+$/.test(value.trim())) return "URC Name contains invalid characters.";
        if (value.trim().length < 2) return "URC Name must be at least 2 characters.";
        return "";
      }
      case "service": {
        if (!value) return "Please select a Service.";
        return "";
      }
      case "applicantCategory": {
        if (!value) return "Please select Category of Applicant.";
        return "";
      }
      case "cardCategory": {
        if (!value) return "Please select Card Category.";
        return "";
      }
      case "payLevel": {
        if (!value) return "Please select Pay Level.";
        return "";
      }
      case "cardApplied": {
        if (!value || value.length === 0) return "Please select at least one Card Applied for.";
        return "";
      }
      case "oldLiquorGroceryCardId": {
        if (allValues.applicationType === "reapplying") {
          if (!value || !value.trim()) return "Old Card ID is required when reapplying.";
          if (value.trim().length < 3) return "Please enter a valid Old Card ID.";
        }
        return "";
      }
      case "substantiveRank": {
        if (!value || !value.trim()) return "Substantive Rank is required.";
        if (!/^[A-Za-z0-9\s./()-]+$/.test(value.trim())) return "Substantive Rank contains invalid characters.";
        return "";
      }
      case "personalNumber": {
        if (!value || !value.trim()) return "Personal Number is required.";
        if (!/^[A-Za-z0-9/-]+$/.test(value.trim())) return "Personal Number must be alphanumeric.";
        return "";
      }
      case "fullName": {
        if (!value || !value.trim()) return "Full Name is required.";
        if (!/^[A-Za-z\s.]+$/.test(value.trim())) return "Full Name should contain letters and spaces only.";
        if (value.trim().length < 2) return "Full Name must be at least 2 characters.";
        return "";
      }
      case "dateOfBirth": {
        if (!value) return "Date of Birth is required.";
        const dob = new Date(value);
        const today = new Date();
        if (isNaN(dob.getTime()) || dob >= today) return "Please enter a valid past Date of Birth.";
        return "";
      }
      case "panCardNumber": {
        if (!value || !value.trim()) return "PAN Card Number is required.";
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(value.trim())) {
          return "Please enter PAN in the format ABCDE1234F (5 letters, 4 digits, 1 letter).";
        }
        return "";
      }
      case "applicantMobile": {
        if (!value || !value.trim()) return "Applicant Mobile Number is required.";
        // Indian Mobile Number: exactly 10 digits starting with 6, 7, 8, or 9
        const mobRegex = /^[6-9][0-9]{9}$/;
        if (!mobRegex.test(value.trim())) {
          return "Please enter a valid 10-digit mobile number.";
        }
        return "";
      }
      case "telNo": {
        if (value && value.trim()) {
          // Telephone / alternate contact: numeric, 6 to 12 digits
          const telRegex = /^[0-9]{6,12}$/;
          if (!telRegex.test(value.trim())) {
            return "Please enter a valid telephone number (6-12 digits numeric).";
          }
        }
        return "";
      }
      case "email": {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return "Please enter a valid email address.";
          }
        }
        return "";
      }
      case "gender": {
        if (!value) return "Please select Gender.";
        return "";
      }
      case "fatherName": {
        if (!value || !value.trim()) return "Father's Name is required.";
        if (!/^[A-Za-z\s.]+$/.test(value.trim())) return "Father's Name should contain letters and spaces only.";
        return "";
      }
      case "spouseNokName": {
        if (value && value.trim()) {
          if (!/^[A-Za-z\s.]+$/.test(value.trim())) return "Spouse/NOK Name should contain letters and spaces only.";
        }
        return "";
      }
      case "permanentAddress1": {
        if (!value || !value.trim()) return "Permanent Address Line 1 is required.";
        return "";
      }
      case "city": {
        if (!value || !value.trim()) return "City is required.";
        if (!/^[A-Za-z\s.-]+$/.test(value.trim())) return "City should contain letters and spaces only.";
        return "";
      }
      case "state": {
        if (!value || !value.trim()) return "State is required.";
        if (!/^[A-Za-z\s.-]+$/.test(value.trim())) return "State should contain letters and spaces only.";
        return "";
      }
      case "pin": {
        if (!value || !value.trim()) return "PIN Code is required.";
        if (!/^[0-9]{6}$/.test(value.trim())) return "Please enter a valid 6-digit PIN code.";
        return "";
      }
      case "dependent1": {
        if (allValues.dependent1Name && allValues.dependent1Name.trim()) {
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent1Name.trim())) return "Dependent 1 Name should contain letters and spaces only.";
          if (!allValues.dependent1Relation) return "Please select relation for Dependent 1.";
          if (!allValues.dependent1Dob) return "Please enter Date of Birth for Dependent 1.";
          const dDob = new Date(allValues.dependent1Dob);
          if (isNaN(dDob.getTime()) || dDob >= new Date()) return "Please enter a valid Date of Birth for Dependent 1.";
        }
        return "";
      }
      case "dependent2": {
        if (allValues.dependent2Name && allValues.dependent2Name.trim()) {
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent2Name.trim())) return "Dependent 2 Name should contain letters and spaces only.";
          if (!allValues.dependent2Relation) return "Please select relation for Dependent 2.";
          if (!allValues.dependent2Dob) return "Please enter Date of Birth for Dependent 2.";
          const dDob = new Date(allValues.dependent2Dob);
          if (isNaN(dDob.getTime()) || dDob >= new Date()) return "Please enter a valid Date of Birth for Dependent 2.";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 3) {
      const cErr = validateField("captcha", captchaInput);
      if (cErr) stepErrors.captcha = cErr;
    } else if (step === 4) {
      ["urcNo", "urcName", "service", "applicantCategory", "cardCategory", "payLevel", "cardApplied"].forEach((f) => {
        const err = validateField(f, form[f]);
        if (err) stepErrors[f] = err;
      });
    } else if (step === 5) {
      [
        "oldLiquorGroceryCardId",
        "substantiveRank",
        "personalNumber",
        "fullName",
        "dateOfBirth",
        "panCardNumber",
        "applicantMobile",
        "email",
        "gender",
        "fatherName",
        "spouseNokName",
      ].forEach((f) => {
        const err = validateField(f, form[f]);
        if (err) stepErrors[f] = err;
      });
    } else if (step === 6) {
      ["permanentAddress1", "city", "state", "pin", "telNo"].forEach((f) => {
        const err = validateField(f, form[f]);
        if (err) stepErrors[f] = err;
      });
    } else if (step === 7) {
      const dep1Err = validateField("dependent1", null, form);
      if (dep1Err) stepErrors.dependent1 = dep1Err;
      const dep2Err = validateField("dependent2", null, form);
      if (dep2Err) stepErrors.dependent2 = dep2Err;
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors,
    };
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const goToNextStep = (currentStepNum, nextStepNum) => {
    const result = validateStep(currentStepNum);
    if (result.isValid) {
      setWizardStep(nextStepNum);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Mark fields in current step as touched so errors display
      const stepFields = Object.keys(result.errors);
      const newTouched = {};
      stepFields.forEach((k) => {
        newTouched[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...newTouched }));
    }
  };

  const saveWizardToLocalStorage = async (options = { notify: false }) => {
    try {
      const payload = {
        currentStep: wizardStep,
        form: {
          ...form,
          // Always ensure applicationDate and applicationNumber are preserved
          applicationDate: form.applicationDate || getTodayIsoDate(),
          applicationNumber: form.applicationNumber,
        },
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(payload));
      if (options.notify) setDraftMessage("Draft saved successfully.");
    } catch (err) {
      if (options.notify) setDraftMessage("Unable to save draft.");
    }
  };

  /**
   * Load saved draft form-fields from localStorage into React state.
   *
   * IMPORTANT: This function NEVER manages sessionStorage and NEVER writes
   * the application number from the draft back into sessionStorage. The caller
   * (the mount useEffect) is the sole authority over sessionStorage and the
   * application number. Callers pass `appNumberOverride` when they want the
   * freshly-allocated server number to win over any number stored in the draft.
   *
   * @param {string|null} appNumberOverride  If provided, this number is used
   *   as the applicationNumber instead of whatever the draft contains.
   */
  const loadWizardFromLocalStorage = (appNumberOverride = null) => {
    try {
      const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.form) {
        const stored = parsed.form;
        const merged = { ...emptyForm };

        if (stored.step1 || stored.step2 || stored.step3) {
          if (stored.step1) Object.assign(merged, stored.step1);
          if (stored.step2) Object.assign(merged, stored.step2);
          if (stored.step3) Object.assign(merged, stored.step3);
          if (stored.step4) Object.assign(merged, stored.step4);
          if (stored.step5) Object.assign(merged, stored.step5);
          if (stored.step6) Object.assign(merged, stored.step6);
          if (stored.applicationNumber) merged.applicationNumber = stored.applicationNumber;
        } else {
          Object.assign(merged, stored);
        }

        // Ensure a valid application date
        if (!merged.applicationDate) {
          merged.applicationDate = getTodayIsoDate();
        }

        // If the caller supplied a fresh server-allocated number, it WINS.
        // This is always the case for new sessions (no sessionStorage), ensuring
        // that a stale draft number can never replace a freshly-allocated one.
        if (appNumberOverride) {
          merged.applicationNumber = appNumberOverride;
        }
        // NOTE: we intentionally do NOT touch sessionStorage here.
        // sessionStorage is managed exclusively by the mount useEffect.

        setForm(merged);
      }
      if (parsed.currentStep && parsed.currentStep >= 2 && parsed.currentStep <= 8) {
        setWizardStep(parsed.currentStep);
      }
    } catch (err) {
      setLoadError("Failed to load saved draft.");
    }
  };

  // On mount: initialize application number & restore saved draft.
  // IMPORTANT: A useRef is used to guarantee this effect runs exactly once
  // even in React StrictMode double-invoke environments, so we never request
  // two server numbers for a single page load.
  const initRan = React.useRef(false);
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    generateCaptcha();

    /**
     * Application number initialisation — strict two-step priority:
     *
     * STEP 1 — Same-tab refresh (sessionStorage exists):
     *   This tab already has an active application. Reuse it.
     *   Restore form fields from the draft, but sessionStorage wins for the
     *   application number (loadWizardFromLocalStorage receives no override).
     *   Do NOT call the server.
     *
     * STEP 2 — New browser / new tab / browser reopened:
     *   sessionStorage is empty. This is treated as a genuinely NEW application
     *   regardless of whether a draft exists in localStorage. The server is
     *   called for the next sequential number. Draft form FIELDS are restored,
     *   but the application number in the draft is DISCARDED and replaced with
     *   the fresh server-allocated number.
     *
     *   WHY: localStorage draft is browser-specific and can contain a number
     *   from a previous session that other browsers have already advanced past.
     *   Restoring that stale number causes Safari to show a lower number than
     *   Chrome, breaking the cross-browser shared sequence.
     *
     *   The correct invariant:
     *     sessionStorage  → tracks current tab's ACTIVE application
     *     localStorage    → caches form FIELD DATA only (not the global counter)
     *     server counter  → the ONLY authority for the next sequence number
     */

    // ── STEP 1: same-tab refresh ──────────────────────────────────────────
    const sessionCached = sessionStorage.getItem(APP_NUMBER_SESSION_KEY);
    if (sessionCached) {
      console.log(`[APP NUMBER] Refresh — reusing active number: ${sessionCached}`);
      // Restore draft fields; sessionStorage number wins (no override argument).
      loadWizardFromLocalStorage();
      // After loadWizardFromLocalStorage sets form, ensure the session number
      // is the applicationNumber (in case draft had a different value).
      setForm((current) => ({ ...current, applicationNumber: sessionCached }));
      return;
    }

    // ── STEP 2: new session — ALWAYS fetch fresh from server ──────────────
    // The draft's applicationNumber is intentionally NOT peeked at or reused.
    // Only the draft's form FIELDS are restored; the number comes from the server.
    const initNewSession = async () => {
      const num = await fetchNextApplicationNumber();
      if (num) {
        console.log(`[APP NUMBER] Allocated new number: ${num}`);
        sessionStorage.setItem(APP_NUMBER_SESSION_KEY, num);
        // Restore draft form FIELDS if any exist, forcing the new server number
        // to override whatever number the draft contained.
        loadWizardFromLocalStorage(num);
        // Belt-and-suspenders: explicitly set it on form state as well so that
        // even if there is no draft the number appears immediately.
        setForm((current) => ({ ...current, applicationNumber: num }));
      } else {
        setLoadError(
          "Cannot connect to the application server. " +
          "Please ensure the server is running on port 5001 and refresh the page."
        );
      }
    };

    initNewSession();
  }, []);

  // Auto-save form to localStorage when state changes (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      saveWizardToLocalStorage();
    }, 650);
    return () => clearTimeout(id);
  }, [form, wizardStep]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      const err = validateField(key, value, { ...form, [key]: value });
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  const toggleArray = (key, value) => {
    setForm((current) => {
      const currentList = current[key] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];

      if (errors[key]) {
        const err = validateField(key, updatedList, { ...current, [key]: updatedList });
        setErrors((prev) => ({ ...prev, [key]: err }));
      }

      return {
        ...current,
        [key]: updatedList,
      };
    });
  };

  // Service change - Subcategories remain accessible for ALL services
  const handleServiceChange = (selectedService) => {
    update("service", selectedService);
  };

  const handleSubCategoryToggle = (sub) => {
    toggleArray("serviceSubCategory", sub);
  };

  /**
   * Print the current application.
   *
   * Uses the browser's afterprint event to mark the application as printed
   * exactly once. A ref guard prevents double-marking when the user clicks
   * Print multiple times for the same application.
   *
   * Sequence:
   *   1. window.print() → browser shows print dialog
   *   2. User confirms or cancels — afterprint fires either way
   *   3. On first afterprint: isPrintedRef.current = true, form.isPrinted = true
   *   4. Subsequent prints of the same application: form state already has the
   *      same number, isPrintedRef prevents re-marking
   */
  const isPrintedRef = React.useRef(false);

  const handlePrint = () => {
    const appNum = form.applicationNumber;
    console.log(`[APP NUMBER] Printing: ${appNum}`);

    const onAfterPrint = () => {
      window.removeEventListener("afterprint", onAfterPrint);
      if (!isPrintedRef.current) {
        isPrintedRef.current = true;
        console.log(`[APP NUMBER] Consumed: ${appNum} — next new application will get the next server number`);
        // Persist the printed flag in form state so it saves to draft.
        // This does NOT change the visible application number.
        setForm((current) => ({ ...current, isPrinted: true }));
      }
    };

    window.addEventListener("afterprint", onAfterPrint);
    window.print();
  };

  /**
   * Start a completely new application.
   *
   * Clears current session and draft, then fetches the next number from the
   * server. The server counter is the SOLE authority — no local fallback.
   */
  const resetForm = async () => {
    // Clear all persisted state for the current application
    sessionStorage.removeItem(APP_NUMBER_SESSION_KEY);
    localStorage.removeItem(WIZARD_STORAGE_KEY);
    isPrintedRef.current = false;

    // Reset UI state immediately so the wizard goes back to the first page
    setForm({ ...emptyForm, applicationDate: getTodayIsoDate() });
    setErrors({});
    setTouched({});
    setDraftMessage("");
    setLoadError("");
    generateCaptcha();
    setWizardStep(2);

    // Fetch the next sequential number from the server
    const num = await fetchNextApplicationNumber();
    if (num) {
      console.log(`[APP NUMBER] New application allocated: ${num}`);
      sessionStorage.setItem(APP_NUMBER_SESSION_KEY, num);
      setForm((current) => ({ ...current, applicationNumber: num }));
    } else {
      setLoadError(
        "Cannot connect to the application server to generate a new application number. " +
        "Please ensure the server is running on port 5001 and try again."
      );
    }
  };

  return (
    <div className="app-shell">
      {/* Shared header across every wizard page */}
      <nav className="wz-nav-bar no-print">
        <div className="wz-nav-logos">
          <img
            src="/service-logos.png"
            alt="Army, Navy & Air Force"
            className="wz-nav-logo-img"
          />
        </div>
      </nav>

      {/* =====================================================================
          WIZARD UI — screen only, hidden during print
          7 steps: 2=Instructions (first page), 3-8=Form steps (1-6 visually)
          NO PHOTO/SIGNATURE SECTIONS IN WIZARD UI
          ===================================================================== */}
      <div className="no-print" role="region" aria-label="Application Wizard">
        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: IMPORTANT INSTRUCTIONS (first page)                        */}
        {/* ------------------------------------------------------------------ */}
        {wizardStep === 2 && (
          <div className="wz-instructions-wrapper">
            <div className="wz-instructions-title-pill">Important Instructions</div>

            <div className="wz-instructions-card">
              <p className="wz-instructions-intro">
                Applicant must possess the undermentioned documents/details while registering and applying for canteen smart cards.
              </p>

              <div className="wz-inst-numbered-list">
                <div className="wz-inst-numbered-item">
                  1. Fill in your details on the next page. Once all the details have been completed, generate the PDF and take a printout. Affix only a high-resolution physical photograph to the printed application form. Computer-generated or photocopied photographs will not be accepted. The photograph must be duly attested. Submit the completed application form to the Canteen.
                </div>
                <div className="wz-inst-numbered-item">
                  2. Children above 10 years authorised dependent card. (Son over 25 years not authorised. No age limit for Dependent/Widowed/Divorced Daughters).
                </div>
                <div className="wz-inst-numbered-item">
                  3. Payment per card Rs 165/- to PS Quick IT Pvt Ltd &amp; Rs 5/- to canteen. Do not pay twice if reapplying due to rejection. PS Quick IT Pvt Ltd sends rejection note to canteen which serves as Credit Note.
                </div>
                <div className="wz-inst-numbered-item">
                  4. Expect 2 SMS from PS Quick IT Pvt Ltd, 1st to inform application received at PS Quick IT Pvt Ltd Noida, 2nd to inform card prepared and will reach canteen in 15 working days.
                </div>
                <div className="wz-inst-numbered-item">
                  5. If you receive No SMS/Update, contact canteen or write a mail to customercare@cims-net.com giving payment and personal details.
                </div>
                <div className="wz-inst-numbered-item">
                  6. Confirm card not activated/utilised earlier in front of the customer before completing transaction.
                </div>
                <div className="wz-inst-numbered-item">
                  7. To deny misuse &amp; cyber frauds – do not give your canteen card to any other person, do not make photocopy/take photo of card. Physically destroy old/expired cards. Report loss of card by lodging FIR and report to nearest canteen.
                </div>
                <div className="wz-inst-numbered-item">
                  8. All cards to be renewed Annually from &quot;Nearest Canteen&quot; (without new application form). Show PPO/Discharge documents.
                </div>
                <div className="wz-inst-numbered-item">
                  9. Expiry of Card – 10 years from date of issue. Reapply three months before expiry. If primary grocery card is replaced, get active dependent cards relinked/surrendered and get entire grocery quota restored.
                </div>
                <div className="wz-inst-numbered-item">
                  10. In case of denial of canteen facilities or any harassment please write to DDG CS, Canteen Services Directorate, QMG Branch, West Block.
                </div>
              </div>
            </div>

            <div className="wz-instructions-nav">
              <button
                id="instructions-next-btn"
                className="wz-btn-primary"
                type="button"
                onClick={() => setWizardStep(3)}
              >
                I Understand, Proceed →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEPS 3–8: MAIN FORM WIZARD                                         */}
        {/* ------------------------------------------------------------------ */}
        {wizardStep >= 3 && (
          <div className="wz-outer">
            {/* Draft status message */}
            {draftMessage && (
              <div className="wz-status-banner">{draftMessage}</div>
            )}
            {loadError && (
              <div className="wz-alert info">{loadError}</div>
            )}

            {/* Stepper bar */}
            <div className="wz-stepper-bar" aria-hidden="true">
              {[
                { num: 3, label: "Date & Verify" },
                { num: 4, label: "Card & Service" },
                { num: 5, label: "Personal" },
                { num: 6, label: "Address" },
                { num: 7, label: "Dependents" },
                { num: 8, label: "Final Step" },
              ].map(({ num, label }) => (
                <div
                  key={num}
                  className={`wz-step-node ${wizardStep === num ? "active" : ""} ${wizardStep > num ? "done" : ""}`}
                >
                  <div className="wz-step-circle">
                    {wizardStep > num ? "✓" : num - 2}
                  </div>
                  <div className="wz-step-label">{label}</div>
                </div>
              ))}
            </div>

            {/* ======================== STEP 3: Date + CAPTCHA (Step 1 of 6) ======================== */}
            {wizardStep === 3 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Application Date &amp; Verification</div>
                    <div className="wz-card-topbar-sub">Step 1 of 6 — System auto-date and security check</div>
                  </div>
                  <div className="wz-draft-actions">
                    <button className="wz-btn-draft" type="button" onClick={() => saveWizardToLocalStorage({ notify: true })}>
                      Save Draft
                    </button>
                    <button
                      className="wz-btn-draft"
                      type="button"
                      onClick={() => {
                        if (confirm("Clear local draft and reset form?")) {
                          resetForm();
                        }
                      }}
                    >
                      Clear Draft
                    </button>
                  </div>
                </div>

                <div className="wz-card-body">
                  {/* Application Date - Auto-filled and Locked */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">📅</span>
                      Application Details
                    </div>
                    <div className="wz-field-grid cols-1">
                      <div className="wz-field">
                        <label className="wz-label" htmlFor="applicationDate">
                          Application Date <span className="wz-required">*</span>
                          <span className="wz-locked-tag">🔒 Auto-Generated &amp; Locked</span>
                        </label>
                        <div className="wz-locked-input-wrap">
                          <input
                            id="applicationDate"
                            type="text"
                            className="wz-input wz-input-locked"
                            style={{ maxWidth: 280 }}
                            value={isoToDisplay(form.applicationDate)}
                            readOnly
                            disabled
                            aria-readonly="true"
                            title="Application Date is automatically generated from the creation date and cannot be changed manually."
                          />
                        </div>
                        <small className="wz-helper-text">
                          This date represents the official date of creation and cannot be edited.
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* CAPTCHA */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">🔒</span>
                      Security Verification (CAPTCHA)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <div className="wz-captcha-display" aria-label="CAPTCHA code">{captcha}</div>
                        <button
                          type="button"
                          className="wz-captcha-refresh-btn"
                          onClick={() => generateCaptcha()}
                          title="Refresh CAPTCHA"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                      <div className={`wz-field ${touched.captcha && errors.captcha ? "has-error" : ""}`} style={{ maxWidth: 320 }}>
                        <label className="wz-label" htmlFor="captchaInput">
                          Enter the code shown above <span className="wz-required">*</span>
                        </label>
                        <input
                          id="captchaInput"
                          type="text"
                          className={`wz-input ${touched.captcha && errors.captcha ? "input-error" : ""}`}
                          placeholder="Type CAPTCHA here…"
                          value={captchaInput}
                          onChange={(e) => {
                            setCaptchaInput(e.target.value);
                            if (errors.captcha) {
                              setErrors((prev) => ({ ...prev, captcha: "" }));
                            }
                          }}
                          onBlur={() => handleBlur("captcha")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              goToNextStep(3, 4);
                            }
                          }}
                        />
                        {touched.captcha && errors.captcha && (
                          <div className="wz-error-msg">{errors.captcha}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => setWizardStep(2)}>
                      ← Previous
                    </button>
                  </div>
                  <div className="wz-nav-right">
                    <button
                      id="step3-next-btn"
                      className="wz-btn-primary"
                      type="button"
                      onClick={() => goToNextStep(3, 4)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 4: URC / Service / Category / Cards (Step 2 of 6) ======================== */}
            {wizardStep === 4 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">URC, Service &amp; Card Details</div>
                    <div className="wz-card-topbar-sub">Step 2 of 6 — Card category, service branch &amp; URC allocation</div>
                  </div>
                  <div className="wz-draft-actions">
                    <button className="wz-btn-draft" type="button" onClick={() => saveWizardToLocalStorage({ notify: true })}>Save Draft</button>
                    <button className="wz-btn-draft" type="button" onClick={() => { if (confirm("Clear local draft and reset form?")) { resetForm(); } }}>Clear Draft</button>
                  </div>
                </div>

                <div className="wz-card-body">
                  {/* URC Details */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">🏢</span>
                      URC Details
                    </div>
                    <div className="wz-field-grid">
                      <div className={`wz-field ${touched.urcNo && errors.urcNo ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="urcNo">URC No. <span className="wz-required">*</span></label>
                        <input
                          id="urcNo"
                          type="text"
                          className={`wz-input ${touched.urcNo && errors.urcNo ? "input-error" : ""}`}
                          placeholder="Enter URC Number"
                          value={form.urcNo}
                          onChange={(e) => update("urcNo", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("urcNo")}
                        />
                        {touched.urcNo && errors.urcNo && <div className="wz-error-msg">{errors.urcNo}</div>}
                      </div>
                      <div className={`wz-field ${touched.urcName && errors.urcName ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="urcName">URC Name <span className="wz-required">*</span></label>
                        <input
                          id="urcName"
                          type="text"
                          className={`wz-input ${touched.urcName && errors.urcName ? "input-error" : ""}`}
                          placeholder="Enter URC Name"
                          value={form.urcName}
                          onChange={(e) => update("urcName", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("urcName")}
                        />
                        {touched.urcName && errors.urcName && <div className="wz-error-msg">{errors.urcName}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Service & Subcategories (Subcategories ALWAYS Accessible) */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">🎖️</span>
                      Service Details
                    </div>
                    <div className={`wz-field ${touched.service && errors.service ? "has-error" : ""}`}>
                      <label className="wz-label">Select Service <span className="wz-required">*</span></label>
                      <div className="wz-option-group">
                        {["Army", "Navy", "Airforce", "Others"].map((s) => (
                          <label key={s} className={`wz-option-pill ${form.service === s ? "selected" : ""}`}>
                            <input
                              type="radio"
                              name="serviceW"
                              checked={form.service === s}
                              onChange={() => handleServiceChange(s)}
                              onBlur={() => handleBlur("service")}
                            />
                            {s}
                          </label>
                        ))}
                      </div>
                      {touched.service && errors.service && <div className="wz-error-msg">{errors.service}</div>}
                    </div>

                    {/* Service Sub-categories - Accessible regardless of selected service */}
                    <div className="wz-field" style={{ marginTop: 14 }}>
                      <label className="wz-label">
                        Service Subcategories (Applicable for all services)
                      </label>
                      <div className="wz-option-group">
                        {serviceSubCategories.map((s) => (
                          <label key={s} className={`wz-option-pill ${form.serviceSubCategory.includes(s) ? "selected" : ""}`}>
                            <input
                              type="checkbox"
                              checked={form.serviceSubCategory.includes(s)}
                              onChange={() => handleSubCategoryToggle(s)}
                            />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category & Pay Level */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">📋</span>
                      Category &amp; Applicant Type
                    </div>
                    <div className="wz-field-grid">
                      <div className={`wz-field span-2 ${touched.applicantCategory && errors.applicantCategory ? "has-error" : ""}`}>
                        <label className="wz-label">Category of Applicant <span className="wz-required">*</span></label>
                        <div className="wz-option-group">
                          {applicantCategories.map((c) => (
                            <label key={c} className={`wz-option-pill ${form.applicantCategory === c ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="applicantCategoryW"
                                checked={form.applicantCategory === c}
                                onChange={() => update("applicantCategory", c)}
                                onBlur={() => handleBlur("applicantCategory")}
                              />
                              {c}
                            </label>
                          ))}
                        </div>
                        {touched.applicantCategory && errors.applicantCategory && (
                          <div className="wz-error-msg">{errors.applicantCategory}</div>
                        )}
                      </div>

                      <div className={`wz-field ${touched.cardCategory && errors.cardCategory ? "has-error" : ""}`}>
                        <label className="wz-label">Card Category <span className="wz-required">*</span></label>
                        <div className="wz-option-group">
                          {cardCategories.map((c) => (
                            <label key={c} className={`wz-option-pill ${form.cardCategory === c ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="cardCategoryW"
                                checked={form.cardCategory === c}
                                onChange={() => update("cardCategory", c)}
                                onBlur={() => handleBlur("cardCategory")}
                              />
                              {c}
                            </label>
                          ))}
                        </div>
                        {touched.cardCategory && errors.cardCategory && (
                          <div className="wz-error-msg">{errors.cardCategory}</div>
                        )}
                      </div>

                      <div className={`wz-field ${touched.payLevel && errors.payLevel ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="payLevelW">Pay Level <span className="wz-required">*</span></label>
                        <select
                          id="payLevelW"
                          className={`wz-select ${touched.payLevel && errors.payLevel ? "input-error" : ""}`}
                          value={form.payLevel}
                          onChange={(e) => update("payLevel", e.target.value)}
                          onBlur={() => handleBlur("payLevel")}
                        >
                          <option value="">-- Select Pay Level --</option>
                          {payLevels.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        {touched.payLevel && errors.payLevel && (
                          <div className="wz-error-msg">{errors.payLevel}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cards Applied For */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">💳</span>
                      Cards Applied For
                    </div>
                    <div className={`wz-field ${touched.cardApplied && errors.cardApplied ? "has-error" : ""}`}>
                      <label className="wz-label">Select Card(s) Applied <span className="wz-required">*</span></label>
                      <div className="wz-option-group">
                        {cardOptions.map((opt) => (
                          <label key={opt} className={`wz-option-pill ${form.cardApplied.includes(opt) ? "selected" : ""}`}>
                            <input
                              type="checkbox"
                              checked={form.cardApplied.includes(opt)}
                              onChange={() => toggleArray("cardApplied", opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {touched.cardApplied && errors.cardApplied && (
                        <div className="wz-error-msg">{errors.cardApplied}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => setWizardStep(3)}>← Previous</button>
                  </div>
                  <div className="wz-nav-right">
                    <button
                      id="step4-next-btn"
                      className="wz-btn-primary"
                      type="button"
                      onClick={() => goToNextStep(4, 5)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 5: Personal Details (Step 3 of 6) ======================== */}
            {wizardStep === 5 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Personal &amp; Service Details</div>
                    <div className="wz-card-topbar-sub">Step 3 of 6 — Applicant personal identity &amp; service information</div>
                  </div>
                  <div className="wz-draft-actions">
                    <button className="wz-btn-draft" type="button" onClick={() => saveWizardToLocalStorage({ notify: true })}>Save Draft</button>
                    <button className="wz-btn-draft" type="button" onClick={() => { if (confirm("Clear local draft and reset form?")) { resetForm(); } }}>Clear Draft</button>
                  </div>
                </div>

                <div className="wz-card-body">
                  {/* Application Type */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">📝</span>
                      Application Type
                    </div>
                    <div className="wz-field-grid">
                      <div className="wz-field">
                        <label className="wz-label">Application Type <span className="wz-required">*</span></label>
                        <div className="wz-option-group">
                          <label className={`wz-option-pill ${form.applicationType === "firstTime" ? "selected" : ""}`}>
                            <input type="radio" name="appTypeW" checked={form.applicationType === "firstTime"} onChange={() => update("applicationType", "firstTime")} />
                            Applying 1st Time
                          </label>
                          <label className={`wz-option-pill ${form.applicationType === "reapplying" ? "selected" : ""}`}>
                            <input type="radio" name="appTypeW" checked={form.applicationType === "reapplying"} onChange={() => update("applicationType", "reapplying")} />
                            Reapplying
                          </label>
                        </div>
                      </div>

                      <div className={`wz-field ${touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="oldCardId" style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}>
                          Old Liquor / Grocery Card ID {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                        </label>
                        <input
                          id="oldCardId"
                          type="text"
                          className={`wz-input ${touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId ? "input-error" : ""}`}
                          placeholder="Old Card ID"
                          disabled={form.applicationType === "firstTime"}
                          value={form.oldLiquorGroceryCardId}
                          onChange={(e) => update("oldLiquorGroceryCardId", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("oldLiquorGroceryCardId")}
                        />
                        {touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId && (
                          <div className="wz-error-msg">{errors.oldLiquorGroceryCardId}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service Record */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">🎖️</span>
                      Service Record
                    </div>
                    <div className="wz-field-grid">
                      <div className={`wz-field ${touched.substantiveRank && errors.substantiveRank ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="substantiveRank">Substantive Rank on Retirement/Discharge <span className="wz-required">*</span></label>
                        <input
                          id="substantiveRank"
                          type="text"
                          className={`wz-input ${touched.substantiveRank && errors.substantiveRank ? "input-error" : ""}`}
                          placeholder="e.g. Major General / Subedar"
                          value={form.substantiveRank}
                          onChange={(e) => update("substantiveRank", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("substantiveRank")}
                        />
                        {touched.substantiveRank && errors.substantiveRank && (
                          <div className="wz-error-msg">{errors.substantiveRank}</div>
                        )}
                      </div>

                      <div className={`wz-field ${touched.personalNumber && errors.personalNumber ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="personalNumber">Personal Number <span className="wz-required">*</span></label>
                        <input
                          id="personalNumber"
                          type="text"
                          className={`wz-input ${touched.personalNumber && errors.personalNumber ? "input-error" : ""}`}
                          placeholder="Enter Personal Number"
                          value={form.personalNumber}
                          onChange={(e) => update("personalNumber", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("personalNumber")}
                        />
                        {touched.personalNumber && errors.personalNumber && (
                          <div className="wz-error-msg">{errors.personalNumber}</div>
                        )}
                      </div>

                      <div className="wz-field">
                        <label className="wz-label" htmlFor="ppoNumber">PPO Number (if allotted)</label>
                        <input
                          id="ppoNumber"
                          type="text"
                          className="wz-input"
                          placeholder="Pension Pay Account No."
                          value={form.ppoNumber}
                          onChange={(e) => update("ppoNumber", e.target.value)}
                        />
                      </div>

                      {/* Strict PAN Card Number Validation */}
                      <div className={`wz-field ${touched.panCardNumber && errors.panCardNumber ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="panCardNumber">PAN Card Number <span className="wz-required">*</span></label>
                        <input
                          id="panCardNumber"
                          type="text"
                          className={`wz-input ${touched.panCardNumber && errors.panCardNumber ? "input-error" : ""}`}
                          placeholder="e.g. ABCDE1234F"
                          value={form.panCardNumber}
                          maxLength={10}
                          onChange={(e) => {
                            // Strip spaces and special chars, convert to uppercase
                            const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
                            update("panCardNumber", val);
                          }}
                          onBlur={() => handleBlur("panCardNumber")}
                        />
                        {touched.panCardNumber && errors.panCardNumber ? (
                          <div className="wz-error-msg">{errors.panCardNumber}</div>
                        ) : (
                          <small className="wz-helper-text">Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">👤</span>
                      Personal Information
                    </div>
                    <div className="wz-field-grid">
                      <div className={`wz-field span-2 ${touched.fullName && errors.fullName ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="fullNameW">Full Name <span className="wz-required">*</span></label>
                        <input
                          id="fullNameW"
                          type="text"
                          className={`wz-input ${touched.fullName && errors.fullName ? "input-error" : ""}`}
                          placeholder="Full Name as per official records"
                          value={form.fullName}
                          onChange={(e) => update("fullName", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("fullName")}
                        />
                        {touched.fullName && errors.fullName && <div className="wz-error-msg">{errors.fullName}</div>}
                      </div>

                      <div className={`wz-field ${touched.dateOfBirth && errors.dateOfBirth ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="dobW">Date of Birth <span className="wz-required">*</span></label>
                        <input
                          id="dobW"
                          type="date"
                          className={`wz-input ${touched.dateOfBirth && errors.dateOfBirth ? "input-error" : ""}`}
                          value={form.dateOfBirth || ""}
                          onChange={(e) => update("dateOfBirth", e.target.value)}
                          onBlur={() => handleBlur("dateOfBirth")}
                        />
                        {touched.dateOfBirth && errors.dateOfBirth && <div className="wz-error-msg">{errors.dateOfBirth}</div>}
                      </div>

                      <div className={`wz-field ${touched.gender && errors.gender ? "has-error" : ""}`}>
                        <label className="wz-label">Gender <span className="wz-required">*</span></label>
                        <div className="wz-option-group">
                          {["Male", "Female"].map((g) => (
                            <label key={g} className={`wz-option-pill ${form.gender === g ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="genderW"
                                checked={form.gender === g}
                                onChange={() => update("gender", g)}
                                onBlur={() => handleBlur("gender")}
                              />
                              {g}
                            </label>
                          ))}
                        </div>
                        {touched.gender && errors.gender && <div className="wz-error-msg">{errors.gender}</div>}
                      </div>

                      <div className="wz-field">
                        <label className="wz-label">Marital Status</label>
                        <div className="wz-option-group">
                          {["Married", "Single", "Widow / Widower"].map((ms) => (
                            <label key={ms} className={`wz-option-pill ${form.maritalStatus === ms ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="maritalW"
                                checked={form.maritalStatus === ms}
                                onChange={() => update("maritalStatus", ms)}
                              />
                              {ms}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="wz-field">
                        <label className="wz-label" htmlFor="dateOfJoining">Date of Joining (Optional)</label>
                        <input
                          id="dateOfJoining"
                          type="date"
                          className="wz-input"
                          value={form.dateOfJoining || ""}
                          onChange={(e) => update("dateOfJoining", e.target.value)}
                        />
                      </div>

                      <div className="wz-field">
                        <label className="wz-label" htmlFor="dateOfRetirement">Date of Retirement (Optional)</label>
                        <input
                          id="dateOfRetirement"
                          type="date"
                          className="wz-input"
                          value={form.dateOfRetirement || ""}
                          onChange={(e) => update("dateOfRetirement", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact & Family Details */}
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">📞</span>
                      Contact &amp; Family Details
                    </div>
                    <div className="wz-field-grid">
                      {/* Mobile Number - Exactly 10 digits Indian mobile format */}
                      <div className={`wz-field ${touched.applicantMobile && errors.applicantMobile ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="applicantMobileW">Applicant Mobile Number <span className="wz-required">*</span></label>
                        <input
                          id="applicantMobileW"
                          type="text"
                          className={`wz-input ${touched.applicantMobile && errors.applicantMobile ? "input-error" : ""}`}
                          placeholder="10-digit mobile number"
                          value={form.applicantMobile}
                          maxLength={10}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                            update("applicantMobile", val);
                          }}
                          onBlur={() => handleBlur("applicantMobile")}
                        />
                        {touched.applicantMobile && errors.applicantMobile && (
                          <div className="wz-error-msg">{errors.applicantMobile}</div>
                        )}
                      </div>

                      <div className={`wz-field ${touched.email && errors.email ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="emailW">Email Address</label>
                        <input
                          id="emailW"
                          type="email"
                          className={`wz-input ${touched.email && errors.email ? "input-error" : ""}`}
                          placeholder="user@example.com"
                          value={form.email}
                          onChange={(e) => update("email", e.target.value)}
                          onBlur={() => handleBlur("email")}
                        />
                        {touched.email && errors.email && <div className="wz-error-msg">{errors.email}</div>}
                      </div>

                      <div className={`wz-field ${touched.fatherName && errors.fatherName ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="fatherNameW">Applicant's Father's Name <span className="wz-required">*</span></label>
                        <input
                          id="fatherNameW"
                          type="text"
                          className={`wz-input ${touched.fatherName && errors.fatherName ? "input-error" : ""}`}
                          placeholder="Father's full name"
                          value={form.fatherName}
                          onChange={(e) => update("fatherName", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("fatherName")}
                        />
                        {touched.fatherName && errors.fatherName && (
                          <div className="wz-error-msg">{errors.fatherName}</div>
                        )}
                      </div>

                      <div className={`wz-field ${touched.spouseNokName && errors.spouseNokName ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="spouseNokW">Spouse / NOK Name</label>
                        <input
                          id="spouseNokW"
                          type="text"
                          className={`wz-input ${touched.spouseNokName && errors.spouseNokName ? "input-error" : ""}`}
                          placeholder="Spouse or Next of Kin name"
                          value={form.spouseNokName}
                          onChange={(e) => update("spouseNokName", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("spouseNokName")}
                        />
                        {touched.spouseNokName && errors.spouseNokName && (
                          <div className="wz-error-msg">{errors.spouseNokName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => setWizardStep(4)}>← Previous</button>
                  </div>
                  <div className="wz-nav-right">
                    <button
                      id="step5-next-btn"
                      className="wz-btn-primary"
                      type="button"
                      onClick={() => goToNextStep(5, 6)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 6: Permanent Address (Step 4 of 6) ======================== */}
            {wizardStep === 6 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Permanent Address Details</div>
                    <div className="wz-card-topbar-sub">Step 4 of 6 — Residential address and contact information</div>
                  </div>
                  <div className="wz-draft-actions">
                    <button className="wz-btn-draft" type="button" onClick={() => saveWizardToLocalStorage({ notify: true })}>Save Draft</button>
                    <button className="wz-btn-draft" type="button" onClick={() => { if (confirm("Clear local draft and reset form?")) { resetForm(); } }}>Clear Draft</button>
                  </div>
                </div>

                <div className="wz-card-body">
                  <div className="wz-section">
                    <div className="wz-section-heading">
                      <span className="wz-section-heading-icon">🏠</span>
                      Address Details
                    </div>
                    <div className="wz-field-grid cols-1">
                      <div className={`wz-field ${touched.permanentAddress1 && errors.permanentAddress1 ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="addr1">Permanent Address — Line 1 <span className="wz-required">*</span></label>
                        <input
                          id="addr1"
                          type="text"
                          className={`wz-input ${touched.permanentAddress1 && errors.permanentAddress1 ? "input-error" : ""}`}
                          placeholder="House No., Street, Colony, Landmark…"
                          value={form.permanentAddress1}
                          onChange={(e) => update("permanentAddress1", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("permanentAddress1")}
                        />
                        {touched.permanentAddress1 && errors.permanentAddress1 && (
                          <div className="wz-error-msg">{errors.permanentAddress1}</div>
                        )}
                      </div>

                      <div className="wz-field">
                        <label className="wz-label" htmlFor="addr2">Permanent Address — Line 2 (Optional)</label>
                        <input
                          id="addr2"
                          type="text"
                          className="wz-input"
                          placeholder="Area, Post Office, Tehsil…"
                          value={form.permanentAddress2}
                          onChange={(e) => update("permanentAddress2", e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div className="wz-field-grid cols-3" style={{ marginTop: 16 }}>
                      <div className={`wz-field ${touched.city && errors.city ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="cityW">City <span className="wz-required">*</span></label>
                        <input
                          id="cityW"
                          type="text"
                          className={`wz-input ${touched.city && errors.city ? "input-error" : ""}`}
                          placeholder="City"
                          value={form.city}
                          onChange={(e) => update("city", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("city")}
                        />
                        {touched.city && errors.city && <div className="wz-error-msg">{errors.city}</div>}
                      </div>

                      <div className={`wz-field ${touched.state && errors.state ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="stateW">State <span className="wz-required">*</span></label>
                        <input
                          id="stateW"
                          type="text"
                          className={`wz-input ${touched.state && errors.state ? "input-error" : ""}`}
                          placeholder="State"
                          value={form.state}
                          onChange={(e) => update("state", e.target.value.toUpperCase())}
                          onBlur={() => handleBlur("state")}
                        />
                        {touched.state && errors.state && <div className="wz-error-msg">{errors.state}</div>}
                      </div>

                      <div className={`wz-field ${touched.pin && errors.pin ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="pinW">PIN Code <span className="wz-required">*</span></label>
                        <input
                          id="pinW"
                          type="text"
                          className={`wz-input ${touched.pin && errors.pin ? "input-error" : ""}`}
                          placeholder="6-digit PIN"
                          value={form.pin}
                          maxLength={6}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                            update("pin", val);
                          }}
                          onBlur={() => handleBlur("pin")}
                        />
                        {touched.pin && errors.pin && <div className="wz-error-msg">{errors.pin}</div>}
                      </div>
                    </div>

                    {/* Telephone / Alternate Contact Validation */}
                    <div className="wz-field-grid" style={{ marginTop: 16 }}>
                      <div className={`wz-field ${touched.telNo && errors.telNo ? "has-error" : ""}`}>
                        <label className="wz-label" htmlFor="telNoW">Telephone / Alternate Contact Number (Optional)</label>
                        <input
                          id="telNoW"
                          type="text"
                          className={`wz-input ${touched.telNo && errors.telNo ? "input-error" : ""}`}
                          placeholder="Landline or alternate phone number"
                          value={form.telNo}
                          maxLength={12}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 12);
                            update("telNo", val);
                          }}
                          onBlur={() => handleBlur("telNo")}
                        />
                        {touched.telNo && errors.telNo && <div className="wz-error-msg">{errors.telNo}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => setWizardStep(5)}>← Previous</button>
                  </div>
                  <div className="wz-nav-right">
                    <button id="step6-next-btn" className="wz-btn-primary" type="button" onClick={() => goToNextStep(6, 7)}>Next →</button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 7: Dependents (Step 5 of 6) ======================== */}
            {wizardStep === 7 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Dependent Information</div>
                    <div className="wz-card-topbar-sub">Step 5 of 6 — Information for eligible dependents (Optional)</div>
                  </div>
                  <div className="wz-draft-actions">
                    <button className="wz-btn-draft" type="button" onClick={() => saveWizardToLocalStorage({ notify: true })}>Save Draft</button>
                    <button className="wz-btn-draft" type="button" onClick={() => { if (confirm("Clear local draft and reset form?")) { resetForm(); } }}>Clear Draft</button>
                  </div>
                </div>

                <div className="wz-card-body">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Dependent 1 */}
                    <div className="wz-dep-card">
                      <div className="wz-section-heading">
                        <span className="wz-section-heading-icon">👤</span>
                        Dependent 1 (Optional)
                      </div>
                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label" htmlFor="dep1name">Full Name</label>
                        <input
                          id="dep1name"
                          type="text"
                          className="wz-input"
                          placeholder="Dependent 1 full name"
                          value={form.dependent1Name}
                          onChange={(e) => update("dependent1Name", e.target.value.toUpperCase())}
                        />
                      </div>

                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label">Relation with Applicant</label>
                        <div className="wz-option-group">
                          {["Spouse", "Daughter", "Son", "Mother", "Father"].map((r) => (
                            <label key={r} className={`wz-option-pill ${form.dependent1Relation === r ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="dep1rel"
                                checked={form.dependent1Relation === r}
                                onChange={() => update("dependent1Relation", r)}
                              />
                              {r}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label" htmlFor="dep1dob">Date of Birth</label>
                        <input
                          id="dep1dob"
                          type="date"
                          className="wz-input"
                          value={form.dependent1Dob || ""}
                          onChange={(e) => update("dependent1Dob", e.target.value)}
                        />
                      </div>

                      {errors.dependent1 && (
                        <div className="wz-error-msg" style={{ marginTop: 8 }}>{errors.dependent1}</div>
                      )}
                    </div>

                    {/* Dependent 2 */}
                    <div className="wz-dep-card">
                      <div className="wz-section-heading">
                        <span className="wz-section-heading-icon">👤</span>
                        Dependent 2 (Optional)
                      </div>
                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label" htmlFor="dep2name">Full Name</label>
                        <input
                          id="dep2name"
                          type="text"
                          className="wz-input"
                          placeholder="Dependent 2 full name"
                          value={form.dependent2Name}
                          onChange={(e) => update("dependent2Name", e.target.value.toUpperCase())}
                        />
                      </div>

                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label">Relation with Applicant</label>
                        <div className="wz-option-group">
                          {["Spouse", "Daughter", "Son", "Mother", "Father"].map((r) => (
                            <label key={r} className={`wz-option-pill ${form.dependent2Relation === r ? "selected" : ""}`}>
                              <input
                                type="radio"
                                name="dep2rel"
                                checked={form.dependent2Relation === r}
                                onChange={() => update("dependent2Relation", r)}
                              />
                              {r}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="wz-field" style={{ marginBottom: 14 }}>
                        <label className="wz-label" htmlFor="dep2dob">Date of Birth</label>
                        <input
                          id="dep2dob"
                          type="date"
                          className="wz-input"
                          value={form.dependent2Dob || ""}
                          onChange={(e) => update("dependent2Dob", e.target.value)}
                        />
                      </div>

                      {errors.dependent2 && (
                        <div className="wz-error-msg" style={{ marginTop: 8 }}>{errors.dependent2}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => setWizardStep(6)}>← Previous</button>
                  </div>
                  <div className="wz-nav-right">
                    <button id="step7-next-btn" className="wz-btn-primary" type="button" onClick={() => goToNextStep(7, 8)}>Next →</button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 8: Final Action Stage (Step 6 of 6) ======================== */}
            {/* Contains ONLY the 3 action buttons: Previous, Save Draft, Print / Save PDF */}
            {wizardStep === 8 && (
              <div className="wz-card wz-final-action-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Application Finalisation</div>
                    <div className="wz-card-topbar-sub">Step 6 of 6 — Finalize your application and print the official 2-page summary</div>
                  </div>
                </div>

                <div className="wz-card-body wz-final-action-body">
                  <div className="wz-final-summary-box">
                    <div className="wz-final-icon">✅</div>
                    <h3 className="wz-final-title">Application Form Completed</h3>
                    <p className="wz-final-desc">
                      Your Canteen Smart Card application form is ready. You can save your draft locally or print the official 2-page tabular summary to sign and paste physical photographs.
                    </p>
                    <div className="wz-app-num-pill">
                      Application No: <strong>{form.applicationNumber || "OE-Pending"}</strong>
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer wz-final-footer">
                  <div className="wz-final-button-group">
                    <button
                      id="final-prev-btn"
                      className="wz-btn-secondary"
                      type="button"
                      onClick={() => setWizardStep(7)}
                    >
                      ← Previous
                    </button>
                    <button
                      id="final-save-btn"
                      className="wz-btn-secondary"
                      type="button"
                      onClick={() => saveWizardToLocalStorage({ notify: true })}
                    >
                      💾 Save Draft
                    </button>
                    <button
                      id="print-btn"
                      className="wz-btn-print"
                      type="button"
                      onClick={() => handlePrint()}
                    >
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          OFFICIAL 2-PAGE PRINT SUMMARY RECORD
          Screen: hidden | Print: visible (EXACTLY 2 A4 PAGES)
          Follows original physical form structure, photo/signature placement,
          Self Declaration, Verified & Countersigned, and Important Instructions.
          ===================================================================== */}
      <PrintableTabularSummary form={form} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// DEDICATED OFFICIAL PRINTABLE TABULAR SUMMARY COMPONENT (EXACTLY 2 A4 PAGES)
// -----------------------------------------------------------------------------
function PrintableTabularSummary({ form }) {
  const getVal = (val) => {
    if (val === undefined || val === null || val === "") return "—";
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(", ") : "—";
    }
    return String(val);
  };

  const appTypeDisplay =
    form.applicationType === "firstTime"
      ? "Applying 1st Time"
      : form.applicationType === "reapplying"
      ? "Reapplying"
      : form.applicationType || "—";

  return (
    <div className="printable-summary-container print-only">
      {/* ======================== PAGE 1 OF 2 ======================== */}
      <div className="print-page print-page-1">
        {/* Main Header */}
        <header className="pr-page-header">
          <div className="pr-header-top-row">
            <div className="pr-header-badge">CANTEEN SERVICES DIRECTORATE &bull; QMG BRANCH</div>
            <div className="pr-header-appno">
              Application No: <strong>{form.applicationNumber || "OE-0000000"}</strong>
            </div>
          </div>
          <h1 className="pr-main-title">CANTEEN SMART CARD APPLICATION FORM</h1>
          <div className="pr-main-subtitle">(FOR ESM &amp; PENSIONER WIDOW/NOK)</div>
          <div className="pr-instructions-bar">
            Please read instructions carefully before filling Application Form. Use Black ball pens only. Fields marked* are mandatory. Fill in CAPITAL only.
          </div>
        </header>

        {/* Top 4-Box Section (Authentic Proportions for Physical Photos & Signatures) */}
        <div className="pr-top-boxes-grid">
          {/* Box 1: Passport Photo */}
          <div className="pr-photo-box">
            <div className="pr-photo-box-header">ATTESTED</div>
            <div className="pr-photo-box-body">
              <div className="pr-photo-box-main-text">Paste your single Passport Size Photo</div>
              <div className="pr-photo-box-note">Offrs: Lounge Suit / Shirt &amp; Tie</div>
              <div className="pr-photo-box-note">Others: Civil Dress</div>
            </div>
            <div className="pr-photo-box-footer">Please Paste. Don't Staple</div>
          </div>

          {/* Box 2: Civil Dress Joint Photo with Spouse */}
          <div className="pr-photo-box">
            <div className="pr-photo-box-header">ATTESTED</div>
            <div className="pr-photo-box-body">
              <div className="pr-photo-box-main-text">Paste Photo in Civil Dress without headgear with spouse</div>
              <div className="pr-photo-box-note">(No separate photos)</div>
            </div>
            <div className="pr-photo-box-footer">Please Paste. Don't Staple</div>
          </div>

          {/* Box 3: Primary Applicant Signature Area */}
          <div className="pr-sig-box">
            <div className="pr-sig-box-header">Sign inside box (Primary Applicant only)</div>
            <div className="pr-sig-blank-area">
              <span className="pr-sig-placeholder-label">Physical Signature of Applicant</span>
            </div>
            <div className="pr-apply-type-row">
              <span className="pr-apply-type-opt">{form.applicationType === "firstTime" ? "☑" : "☐"} *Applying 1st time</span>
              <span className="pr-apply-type-opt">{form.applicationType === "reapplying" ? "☑" : "☐"} *Reapplying</span>
            </div>
            <div className="pr-sig-box-footer">(If applying for both categories, use two separate forms)</div>
          </div>

          {/* Box 4: Application Number Box */}
          <div className="pr-appnum-box">
            <div className="pr-appnum-box-header">Application Number</div>
            <div className="pr-appnum-value">{form.applicationNumber || "OE-0000000"}</div>
            <div className="pr-appnum-date">
              Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
            </div>
            <div className="pr-appnum-note">Official System Record</div>
          </div>
        </div>

        {/* Structured 4-Column Table: Application, Service, Personal, Address Details */}
        <table className="pr-data-table">
          <colgroup>
            <col style={{ width: "23%" }} />
            <col style={{ width: "27%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "27%" }} />
          </colgroup>
          <tbody>
            {/* Section 1: Application & URC Details */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>1. APPLICATION &amp; URC DETAILS</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Application Date</td>
              <td className="pr-val-cell font-bold">{isoToDisplay(form.applicationDate)}</td>
              <td className="pr-field-cell">Application Type</td>
              <td className="pr-val-cell">{appTypeDisplay}</td>
            </tr>
            {form.applicationType === "reapplying" && (
              <tr>
                <td className="pr-field-cell">Old Liquor / Grocery Card ID</td>
                <td className="pr-val-cell font-bold" colSpan={3}>{getVal(form.oldLiquorGroceryCardId)}</td>
              </tr>
            )}
            <tr>
              <td className="pr-field-cell">URC No.</td>
              <td className="pr-val-cell font-bold">{getVal(form.urcNo)}</td>
              <td className="pr-field-cell">URC Name</td>
              <td className="pr-val-cell font-bold">{getVal(form.urcName)}</td>
            </tr>

            {/* Section 2: Service & Card Category Details */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>2. SERVICE &amp; CARD DETAILS</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Service Branch</td>
              <td className="pr-val-cell font-bold">{getVal(form.service)}</td>
              <td className="pr-field-cell">Service Subcategory</td>
              <td className="pr-val-cell">{getVal(form.serviceSubCategory)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Applicant Category</td>
              <td className="pr-val-cell font-bold">{getVal(form.applicantCategory)}</td>
              <td className="pr-field-cell">Card Category</td>
              <td className="pr-val-cell font-bold">{getVal(form.cardCategory)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Pay Level</td>
              <td className="pr-val-cell">{getVal(form.payLevel)}</td>
              <td className="pr-field-cell">Cards Applied For</td>
              <td className="pr-val-cell font-bold">{getVal(form.cardApplied)}</td>
            </tr>

            {/* Section 3: Personal & Service Record */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>3. PERSONAL &amp; SERVICE RECORD</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Full Name (Capital Letters)</td>
              <td className="pr-val-cell font-bold" colSpan={3}>{getVal(form.fullName)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Substantive Rank on Retirement/Discharge</td>
              <td className="pr-val-cell font-bold">{getVal(form.substantiveRank)}</td>
              <td className="pr-field-cell">Personal Number</td>
              <td className="pr-val-cell font-bold">{getVal(form.personalNumber)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Date of Birth</td>
              <td className="pr-val-cell font-bold">{isoToDisplay(form.dateOfBirth)}</td>
              <td className="pr-field-cell">PAN Card Number</td>
              <td className="pr-val-cell font-bold">{getVal(form.panCardNumber)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Date of Joining</td>
              <td className="pr-val-cell">{isoToDisplay(form.dateOfJoining)}</td>
              <td className="pr-field-cell">Date of Retirement</td>
              <td className="pr-val-cell">{isoToDisplay(form.dateOfRetirement)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">PPO Number (if allotted)</td>
              <td className="pr-val-cell">{getVal(form.ppoNumber)}</td>
              <td className="pr-field-cell">Gender &amp; Marital Status</td>
              <td className="pr-val-cell">{getVal(form.gender)} &bull; {getVal(form.maritalStatus)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Father's Name</td>
              <td className="pr-val-cell font-bold">{getVal(form.fatherName)}</td>
              <td className="pr-field-cell">Spouse / NOK Name</td>
              <td className="pr-val-cell font-bold">{getVal(form.spouseNokName)}</td>
            </tr>

            {/* Section 4: Contact & Permanent Address */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>4. CONTACT &amp; PERMANENT ADDRESS DETAILS</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Applicant Mobile Number</td>
              <td className="pr-val-cell font-bold">{getVal(form.applicantMobile)}</td>
              <td className="pr-field-cell">Email Address</td>
              <td className="pr-val-cell">{getVal(form.email)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Permanent Address — Line 1</td>
              <td className="pr-val-cell font-bold" colSpan={3}>{getVal(form.permanentAddress1)}</td>
            </tr>
            {form.permanentAddress2 && form.permanentAddress2.trim() !== "" && (
              <tr>
                <td className="pr-field-cell">Permanent Address — Line 2</td>
                <td className="pr-val-cell" colSpan={3}>{getVal(form.permanentAddress2)}</td>
              </tr>
            )}
            <tr>
              <td className="pr-field-cell">City &amp; State</td>
              <td className="pr-val-cell font-bold">{getVal(form.city)}, {getVal(form.state)}</td>
              <td className="pr-field-cell">PIN Code &amp; Telephone</td>
              <td className="pr-val-cell font-bold">
                PIN: {getVal(form.pin)} {form.telNo ? `| Tel: ${form.telNo}` : ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Self Declaration Section on Page 1 */}
        <div className="pr-declaration-block">
          <div className="pr-declaration-header">SELF DECLARATION</div>
          <ol className="pr-declaration-list">
            <li>I am entitled to canteen facilities as ESM/Widow/NOK Post retirement/PMR/discharge. All the information provided in this application form is correct to the best of my knowledge.</li>
            <li>I am liable to face disciplinary or legal action including cancellation of canteen smart cards and denial of canteen services at any point of time if the information furnished by me is found to be incorrect or false or there is any instance of misuse of CSD facility by me.</li>
            <li>I have applied for dependent cards only for my eligible dependents who are actually dependent on me.</li>
            <li>Certified that I am not holding any other canteen smart cards issued for any other category or any other department.</li>
          </ol>
          <div className="pr-declaration-footer-row">
            <div className="pr-decl-date-col">
              Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
            </div>
            <div className="pr-decl-sig-col">
              <div className="pr-decl-sig-box-frame">
                <span className="pr-decl-sig-label">Signature of Applicant</span>
              </div>
              <div className="pr-decl-sig-title">*Signature of Applicant</div>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="pr-page-footer">
          <div>Canteen Smart Card Portal &bull; Official Tabular Application Record</div>
          <div>Page 1 of 2</div>
        </div>
      </div>

      {/* ======================== PAGE 2 OF 2 ======================== */}
      <div className="print-page print-page-2">
        {/* Page 2 Header */}
        <header className="pr-page-header">
          <div className="pr-header-top-row">
            <div className="pr-header-badge">CANTEEN SERVICES DIRECTORATE &bull; QMG BRANCH</div>
            <div className="pr-header-appno">
              Application No: <strong>{form.applicationNumber || "OE-0000000"}</strong>
            </div>
          </div>
          <h1 className="pr-main-title">CANTEEN SMART CARD APPLICATION FORM</h1>
          <div className="pr-main-subtitle">OFFICIAL ATTESTATIONS, RECEIPT &amp; IMPORTANT INSTRUCTIONS (PAGE 2 OF 2)</div>
        </header>

        {/* Section 5: Dependents Details Table & Media Placeholders */}
        <div className="pr-dependents-container">
          <div className="pr-section-badge">5. DEPENDENT DETAILS &amp; PHYSICAL ATTESTATIONS</div>
          <div className="pr-dep-split-layout">
            {/* Left: Dependent Table Data */}
            <div className="pr-dep-table-wrap">
              <table className="pr-data-table pr-dep-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>DEPENDENT</th>
                    <th style={{ width: "65%" }}>ENTERED DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="pr-sub-header-row"><td colSpan={2}>Dependent 1 (Card 1)</td></tr>
                  <tr><td className="pr-field-cell">Full Name</td><td className="pr-val-cell font-bold">{getVal(form.dependent1Name)}</td></tr>
                  <tr><td className="pr-field-cell">Relation</td><td className="pr-val-cell">{getVal(form.dependent1Relation)}</td></tr>
                  <tr><td className="pr-field-cell">Date of Birth</td><td className="pr-val-cell font-bold">{isoToDisplay(form.dependent1Dob)}</td></tr>

                  <tr className="pr-sub-header-row"><td colSpan={2}>Dependent 2 (Card 2)</td></tr>
                  <tr><td className="pr-field-cell">Full Name</td><td className="pr-val-cell font-bold">{getVal(form.dependent2Name)}</td></tr>
                  <tr><td className="pr-field-cell">Relation</td><td className="pr-val-cell">{getVal(form.dependent2Relation)}</td></tr>
                  <tr><td className="pr-field-cell">Date of Birth</td><td className="pr-val-cell font-bold">{isoToDisplay(form.dependent2Dob)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Right: Physical Photo & Signature Boxes for Dependents */}
            <div className="pr-dep-media-grid">
              <div className="pr-dep-media-card">
                <div className="pr-dep-photo-box">
                  <div className="pr-photo-box-header">ATTESTED</div>
                  <div className="pr-dep-photo-text">Dependent 1 Photo</div>
                  <div className="pr-photo-box-footer">Use Gum. Don't Staple</div>
                </div>
                <div className="pr-dep-sig-box">
                  <div className="pr-dep-sig-blank">Physical Signature</div>
                  <div className="pr-dep-sig-label">Dependent 1 Signature</div>
                </div>
              </div>

              <div className="pr-dep-media-card">
                <div className="pr-dep-photo-box">
                  <div className="pr-photo-box-header">ATTESTED</div>
                  <div className="pr-dep-photo-text">Dependent 2 Photo</div>
                  <div className="pr-photo-box-footer">Use Gum. Don't Staple</div>
                </div>
                <div className="pr-dep-sig-box">
                  <div className="pr-dep-sig-blank">Physical Signature</div>
                  <div className="pr-dep-sig-label">Dependent 2 Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Receipt for Applicant (Multi-Row Structured Official Format) */}
        <div className="pr-receipt-box">
          <div className="pr-receipt-header-row">
            <span className="pr-receipt-title">6. RECEIPT FOR APPLICANT (TO BE FILLED BY CANTEEN STAFF)</span>
            <span className="pr-receipt-appno">App No: <strong>{form.applicationNumber || "OE-0000000"}</strong></span>
          </div>
          <div className="pr-receipt-content">
            <div className="pr-receipt-row">
              Received with thanks a sum of Rs. <span className="pr-receipt-fill">{getVal(form.receiptAmount) !== "—" ? form.receiptAmount : "__________"}</span> from Rank: <span className="pr-receipt-fill">{getVal(form.substantiveRank) !== "—" ? form.substantiveRank : "____________________"}</span> Personal No: <span className="pr-receipt-fill">{getVal(form.personalNumber) !== "—" ? form.personalNumber : "________________"}</span>
            </div>
            <div className="pr-receipt-row">
              Name: <span className="pr-receipt-fill">{getVal(form.fullName) !== "—" ? form.fullName : "________________________________"}</span> for Cards: <span className="pr-receipt-fill">{getVal(form.cardApplied) !== "—" ? form.cardApplied.join(", ") : "Liquor / Grocery / Dependent"}</span> from URC: <span className="pr-receipt-fill">{getVal(form.urcName) !== "—" ? `${form.urcName} (${form.urcNo || ""})` : "________________________"}</span>
            </div>
            <div className="pr-receipt-row">
              Payment via: <span className="pr-receipt-fill">{getVal(form.receiptPaymentDoneVia) !== "—" ? form.receiptPaymentDoneVia : "Cash / Card / Online"}</span> &bull; Cash/Instrument/UTR No: <span className="pr-receipt-fill">{getVal(form.receiptCashInstrumentUtrNo) !== "—" ? form.receiptCashInstrumentUtrNo : "____________________"}</span> &bull; Bank: <span className="pr-receipt-fill">{getVal(form.bankName) !== "—" ? form.bankName : "________________"}</span>
            </div>
            <div className="pr-receipt-bottom-row">
              <div className="pr-receipt-date-block">
                Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
              </div>
              <div className="pr-receipt-stamp-block">
                <div className="pr-receipt-stamp-frame">
                  <span className="pr-receipt-stamp-placeholder">Round Stamp &amp; Signature</span>
                </div>
                <div className="pr-receipt-stamp-title">Signature &amp; Stamp of Canteen / URC</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Verified & Countersigned */}
        <div className="pr-countersigned-box">
          <div className="pr-countersigned-header">7. VERIFIED &amp; COUNTERSIGNED</div>
          <p className="pr-countersigned-text">
            Certified that the eligibility and entitlement of the applicant for canteen services as ESM / Pensioner / Widow / NOK have been verified with PPO / Discharge documents and personal details vetted as correct.
          </p>
          <div className="pr-countersigned-grid">
            <div className="pr-cs-col">
              <div className="pr-cs-stamp-box">
                <span className="pr-cs-stamp-placeholder">Signature &amp; Round Stamp Canteen</span>
              </div>
              <div className="pr-cs-date-line">Date: ________________________</div>
            </div>
            <div className="pr-cs-col">
              <div className="pr-cs-stamp-box">
                <span className="pr-cs-stamp-placeholder">*Signature &amp; Stamp of OIC Canteen / Field Officer</span>
              </div>
              <div className="pr-cs-sub-label">Field Officer (Major/Equivalent)</div>
            </div>
          </div>
        </div>

        {/* Section 8: Important Instructions (10 Points in 2 Columns) */}
        <div className="pr-instructions-container">
          <div className="pr-instructions-header">8. IMPORTANT INSTRUCTIONS: (USE BLACK INK ONLY)</div>
          <div className="pr-instructions-columns">
            <div className="pr-inst-column">
              <div className="pr-inst-item"><span className="pr-inst-num">1.</span><span>Fill in your details on the next page. Once all the details have been completed, generate the PDF and take a printout. Affix only a high-resolution physical photograph to the printed application form. Computer-generated or photocopied photographs will not be accepted. The photograph must be duly attested. Submit the completed application form to the Canteen.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">2.</span><span>Children above 10 years authorised dependent card. (Son over 25 years not authorised. No age limit for Dependent/Widowed/Divorced Daughters).</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">3.</span><span>Payment per card Rs 165/- to PS Quick IT Pvt Ltd &amp; Rs 5/- to canteen. Do not pay twice if reapplying due to rejection. PS Quick IT Pvt Ltd sends rejection note to canteen which serves as Credit Note.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">4.</span><span>Expect 2 SMS from PS Quick IT Pvt Ltd, 1st to inform application received at PS Quick IT Pvt Ltd Noida, 2nd to inform card prepared and will reach canteen in 15 working days.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">5.</span><span>If you receive No SMS/Update, contact canteen or write a mail to customercare@cims-net.com giving payment and personal details.</span></div>
            </div>
            <div className="pr-inst-column">
              <div className="pr-inst-item"><span className="pr-inst-num">6.</span><span>Confirm card not activated/utilised earlier in front of the customer before completing transaction.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">7.</span><span>To deny misuse &amp; cyber frauds – do not give your canteen card to any other person, do not make photocopy/take photo of card. Physically destroy old/expired cards. Report loss of card by lodging FIR and report to nearest canteen.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">8.</span><span>All cards to be renewed Annually from "Nearest Canteen" (without new application form). Show PPO/Discharge documents.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">9.</span><span>Expiry of Card – 10 years from date of issue. Reapply three months before expiry. If primary grocery card is replaced, get active dependent cards relinked/surrendered and get entire grocery quota restored.</span></div>
              <div className="pr-inst-item"><span className="pr-inst-num">10.</span><span>In case of denial of canteen facilities or any harassment please write to DDG CS, Canteen Services Directorate, QMG Branch, West Block.</span></div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="pr-page-footer">
          <div>Canteen Smart Card Portal &bull; Official Tabular Application Record</div>
          <div>Page 2 of 2 (End of Official Application Record)</div>
        </div>
      </div>
    </div>
  );
}
