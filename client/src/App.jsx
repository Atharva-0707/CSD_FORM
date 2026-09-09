import React, { useCallback, useEffect, useState, useRef } from "react";
import "./styles.css";
import { FORM_CATEGORIES, FORM_CONFIGS } from "./formConfigs";
import CategorySelector from "./components/CategorySelector";
import DynamicStepContent from "./components/DynamicStepContent";
import PrintableApplication from "./components/PrintableApplication";

// Helper to get today's date in YYYY-MM-DD format (local date)
export function getTodayLocalDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayIsoDate() {
  return getTodayLocalDate();
}

// Check if a calendar date string YYYY-MM-DD is a valid calendar date
export function isValidCalendarDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yStr, mStr, dStr] = dateStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Global reusable Date of Birth validation for Applicant (rejects empty if required, malformed, today, future, and age < 18)
export function validateApplicantDOB(dateStr, isRequired = true) {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Birth is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Birth.";
  }
  const today = getTodayLocalDate();
  if (val === today) {
    return "Date of Birth cannot be today.";
  }
  if (val > today) {
    return "Date of Birth cannot be in the future.";
  }

  // Exact age calculation using local calendar month and day
  const [bYear, bMonth, bDay] = val.split("-").map(Number);
  const [tYear, tMonth, tDay] = today.split("-").map(Number);

  let age = tYear - bYear;
  if (tMonth < bMonth || (tMonth === bMonth && tDay < bDay)) {
    age--;
  }

  if (age < 18) {
    return "Applicant must be at least 18 years old.";
  }

  return "";
}

// Dependent Date of Birth validation (rejects empty if required, malformed, today, and future; does NOT require age >= 18)
export function validateDependentDOB(dateStr, isRequired = false) {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Birth is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Birth.";
  }
  const today = getTodayLocalDate();
  if (val === today) {
    return "Date of Birth cannot be today.";
  }
  if (val > today) {
    return "Date of Birth cannot be in the future.";
  }
  return "";
}

// Global reusable Date of Birth validation (defaults to validateApplicantDOB)
export function validateDOB(dateStr, isRequired = true) {
  return validateApplicantDOB(dateStr, isRequired);
}

// Reusable date-only helper functions (Calendar safe, timezone independent)
export function normalizeDateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  const datePart = trimmed.split(/[T ]/)[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
}

export function compareDateOnly(dateA, dateB) {
  const normA = normalizeDateOnly(dateA);
  const normB = normalizeDateOnly(dateB);
  if (!normA || !normB) return 0;
  if (normA < normB) return -1;
  if (normA > normB) return 1;
  return 0;
}

export function validateJoiningDateAgainstDOB(dojStr, dobStr, isEnrolment = false) {
  const normDoj = normalizeDateOnly(dojStr);
  const normDob = normalizeDateOnly(dobStr);
  if (normDoj && normDob && compareDateOnly(normDoj, normDob) < 0) {
    return isEnrolment
      ? "Date of Enrolment cannot be before Date of Birth."
      : "Date of Joining cannot be before Date of Birth.";
  }
  return "";
}

// Global reusable Date of Joining validation
export function validateDateOfJoining(dateStr, isRequired = false, dobStr = "") {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Joining is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Joining.";
  }
  if (dobStr) {
    const dobError = validateJoiningDateAgainstDOB(val, dobStr, false);
    if (dobError) return dobError;
  }
  return "";
}

// Likely Date of Commissioning/Attestation (Cadet/Recruit)
export function validateLikelyCommissioningDate(dateStr, isRequired = false, dojStr = "") {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Likely Date of Commissioning/Attestation is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Likely Date of Commissioning/Attestation.";
  }
  if (dojStr && isValidCalendarDate(dojStr) && val < dojStr) {
    return "Commissioning/Attestation date cannot be earlier than Date of Joining.";
  }
  return "";
}

// Date of Retirement validation
export function validateDateOfRetirement(dateStr, isRequired = false, dojStr = "") {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Retirement is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Retirement.";
  }
  if (dojStr && isValidCalendarDate(dojStr) && val < dojStr) {
    return "Date of Retirement cannot be earlier than Date of Joining.";
  }
  return "";
}

// Agniveer Date of Enrolment (cannot be in the past: DOE >= today; DOE >= DOB)
export function validateDateOfEnrolment(dateStr, isRequired = true, dobStr = "") {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Enrolment is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Enrolment.";
  }
  if (dobStr) {
    const dobError = validateJoiningDateAgainstDOB(val, dobStr, true);
    if (dobError) return dobError;
  }
  const today = getTodayLocalDate();
  if (val < today) {
    return "Date of Enrolment cannot be in the past.";
  }
  return "";
}

// Agniveer Date of Release (DOR >= DOE)
export function validateDateOfRelease(dateStr, doeStr = "", isRequired = true) {
  if (!dateStr || !dateStr.trim()) {
    if (isRequired) return "Date of Release is required.";
    return "";
  }
  const val = dateStr.trim();
  if (!isValidCalendarDate(val)) {
    return "Please enter a valid Date of Release.";
  }
  if (doeStr && isValidCalendarDate(doeStr) && val < doeStr) {
    return "Date of Release cannot be earlier than Date of Enrolment.";
  }
  return "";
}

// URC fields validation (optional for all 7 forms)
export function validateURC(field, value) {
  if (!value || !value.trim()) return "";
  const val = value.trim();
  if (field === "urcNo") {
    if (!/^[A-Za-z0-9\-_]+$/.test(val)) return "URC No. must be alphanumeric.";
    if (val.length < 2) return "URC No. must be at least 2 characters.";
  } else if (field === "urcName") {
    if (!/^[A-Za-z0-9\s.&'-]+$/.test(val)) return "URC Name contains invalid characters.";
    if (val.length < 2) return "URC Name must be at least 2 characters.";
  }
  return "";
}

// Date conversion & display helpers
export function isoToDisplay(iso) {
  if (!iso) return "—";
  if (typeof iso === "string") {
    const datePart = iso.split(/[T ]/)[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split("-");
      return `${d}/${m}/${y}`;
    }
  }
  return iso;
}

// Local Storage Keys
const WIZARD_STORAGE_KEY = "canteenSmartCardWizard_v4";
const APP_NUMBER_SESSION_KEY = "oe_app_number";

// Server API endpoints
const API_ENDPOINTS = [
  import.meta.env.VITE_API_URL,
  "http://localhost:5001/api",
  "http://127.0.0.1:5001/api",
].filter(Boolean);

/**
 * Fetch the next application number from the server.
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
  return null;
}

const emptyForm = {
  applicationNumber: "",
  applicationType: "firstTime",
  selectedFormType: "",
  applicationDate: getTodayIsoDate(),

  // URC Details
  urcNo: "",
  urcName: "",

  // Status for Civil Defence Retired
  statusOption: "",

  // Service Details
  service: "",
  serviceSubCategory: [],
  modDepartment: "",
  modDeptOther: "",

  applicantCategory: "",
  cardCategory: "",
  cardApplied: [],
  payLevel: "",
  heldCardNo: "",

  // Old Cards for Reapplying
  oldLiquorGroceryCardId: "",
  oldCadetCardId: "",
  oldGroceryCardId: "",
  oldLiquorCardId: "",

  // Service Record & Rank
  substantiveRank: "",
  personalNumber: "",
  oldPersonalNumber: "",
  fullName: "",

  // Civil Defence Specifics
  cadreOrganisation: "",
  currentDept: "",
  payAccountNo: "",
  parentCadre: "",
  deputationDept: "",
  deputationFrom: "",
  deputationTo: "",
  designation: "",
  ppoDate: "",

  // Dates
  dateOfBirth: "",
  panCardNumber: "",
  dateOfJoining: "",
  dateOfRetirement: "",
  likelyCommissioningDate: "",
  dateOfEnrolment: "",
  dateOfRelease: "",

  ppoNumber: "",
  applicantMobile: "",
  email: "",

  gender: "",
  maritalStatus: "",

  fatherName: "",
  nokName: "",
  spouseNokName: "",

  // Permanent / Contact Address
  permanentAddress1: "",
  permanentAddress2: "",
  city: "",
  state: "",
  pin: "",
  telNo: "",

  // Dependents
  dependent1Name: "",
  dependent1Relation: "",
  dependent1Dob: "",
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

  // Declaration & Countersigned
  declarationDate: "",
  countersignedDate: "",
};

// All old-card fields that are only relevant when applicationType === "reapplying"
const OLD_CARD_FIELDS = [
  "oldLiquorGroceryCardId",
  "oldCadetCardId",
  "oldGroceryCardId",
  "oldLiquorCardId",
];

export default function App() {
  const [form, setForm] = useState(emptyForm);

  // Wizard UI state
  // Steps: 2 = Instructions/Landing, 3 = Verify + Category Selection, 4 = Card & Service, 5 = Personal, 6 = Address, 7 = Dependents, 8 = Final Action
  const [wizardStep, setWizardStep] = useState(2);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Field validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Active configuration based on selected form category
  const activeConfig = FORM_CONFIGS[form.selectedFormType] || FORM_CONFIGS.esmPensionerWidowNok;

  // Compute active dynamic steps for the stepper
  const activeSteps = [
    { num: 3, label: "Verify" },
    { num: 4, label: "Card & Service" },
    { num: 5, label: "Personal" },
    ...(activeConfig.hasAddressStep ? [{ num: 6, label: "Address" }] : []),
    ...(activeConfig.hasDependentsStep ? [{ num: 7, label: "Dependents" }] : []),
    { num: 8, label: "Final Step" },
  ];

  const getNextStepNum = (currentNum) => {
    const idx = activeSteps.findIndex((s) => s.num === currentNum);
    if (idx !== -1 && idx < activeSteps.length - 1) {
      return activeSteps[idx + 1].num;
    }
    return currentNum;
  };

  const getPrevStepNum = (currentNum) => {
    const idx = activeSteps.findIndex((s) => s.num === currentNum);
    if (idx > 0) {
      return activeSteps[idx - 1].num;
    }
    return 2; // back to landing
  };

  // Generate a simple CAPTCHA code
  const generateCaptcha = (len = 6) => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setCaptcha(out);
    setCaptchaInput("");
  };

  // Category change handler with data sanitation
  const handleCategorySelect = (categoryId) => {
    if (categoryId === form.selectedFormType) return;

    // Regenerate CAPTCHA, clear input, error, and touched state
    generateCaptcha();
    setCaptchaInput("");

    const targetConfig = FORM_CONFIGS[categoryId];
    const targetHasNoAppType = targetConfig?.hasApplicationType === false;

    setForm((prev) => {
      const appTypeOverrides = targetHasNoAppType
        ? {
            applicationType: "",
            oldLiquorGroceryCardId: "",
            oldCadetCardId: "",
            oldGroceryCardId: "",
            oldLiquorCardId: "",
          }
        : {
            applicationType: prev.applicationType || "firstTime",
          };

      // Preserve cross-category fields (personal details, address, applicationNumber)
      return {
        ...emptyForm,
        applicationNumber: prev.applicationNumber,
        applicationDate: prev.applicationDate || getTodayIsoDate(),
        selectedFormType: categoryId,
        substantiveRank: categoryId === "agniveer" ? "AGNIVEER" : "",
        ...appTypeOverrides,

        // Common personal details
        fullName: prev.fullName,
        dateOfBirth: prev.dateOfBirth,
        panCardNumber: prev.panCardNumber,
        applicantMobile: prev.applicantMobile,
        email: prev.email,
        gender: prev.gender,
        maritalStatus: prev.maritalStatus,
        fatherName: prev.fatherName,

        // Address
        permanentAddress1: prev.permanentAddress1,
        permanentAddress2: prev.permanentAddress2,
        city: prev.city,
        state: prev.state,
        pin: prev.pin,
        telNo: prev.telNo,
      };
    });

    setErrors((prev) => {
      const next = { ...prev, captcha: "", selectedFormType: "" };
      if (targetHasNoAppType) {
        next.applicationType = "";
        OLD_CARD_FIELDS.forEach((f) => { next[f] = ""; });
      }
      const catFields = [
        "nokName", "spouseNokName", "dateOfJoining", "likelyCommissioningDate",
        "dateOfRetirement", "dateOfEnrolment", "dateOfRelease", "heldCardNo",
        "ppoNumber", "ppoDate", "cadreOrganisation", "currentDept", "payAccountNo",
        "substantiveRank", "designation"
      ];
      catFields.forEach((f) => { next[f] = ""; });
      return next;
    });

    setTouched((prev) => {
      const next = { ...prev, captcha: false };
      if (targetHasNoAppType) {
        next.applicationType = false;
        OLD_CARD_FIELDS.forEach((f) => { next[f] = false; });
      }
      const catFields = [
        "nokName", "spouseNokName", "dateOfJoining", "likelyCommissioningDate",
        "dateOfRetirement", "dateOfEnrolment", "dateOfRelease", "heldCardNo",
        "ppoNumber", "ppoDate", "cadreOrganisation", "currentDept", "payAccountNo",
        "substantiveRank", "designation"
      ];
      catFields.forEach((f) => { next[f] = false; });
      return next;
    });
  };

  // Field validation logic
  const validateField = (field, value, allValues = form) => {
    switch (field) {
      case "selectedFormType": {
        if (!allValues.selectedFormType) return "Please select an application form category before continuing.";
        return "";
      }
      case "captcha": {
        if (!captchaInput || !captchaInput.trim()) return "CAPTCHA code is required.";
        if (captcha.trim().toUpperCase() !== captchaInput.trim().toUpperCase()) {
          return "CAPTCHA code does not match. Please try again.";
        }
        return "";
      }
      case "urcNo": {
        return validateURC("urcNo", value);
      }
      case "urcName": {
        return validateURC("urcName", value);
      }
      case "service": {
        if (!value) return "Please select a Service.";
        return "";
      }
      case "statusOption": {
        if (activeConfig.hasStatusCheckboxes && !value) return "Please select your Applicant Status.";
        return "";
      }
      case "applicantCategory": {
        if (activeConfig.hasApplicantCategory && !value) return "Please select Category of Applicant.";
        return "";
      }
      case "cardCategory": {
        if (activeConfig.hasCategoryOfPersonnel && !value) return "Please select Card Category.";
        return "";
      }
      case "payLevel": {
        if (activeConfig.hasPayLevel && !value) return "Please select Pay Level.";
        return "";
      }
      case "cardApplied": {
        if (activeConfig.hasCardsApplied && (!value || value.length === 0)) {
          return "Please select at least one Card Applied for.";
        }
        return "";
      }
      case "heldCardNo": {
        if (activeConfig.hasPresentlyHeldCardNo && (!value || !value.trim())) {
          return "Presently held Liquor/Grocery Card No. is required.";
        }
        return "";
      }
      case "applicationType": {
        if (activeConfig.hasApplicationType === false) return "";
        if (!value) return "Please select Application Type.";
        return "";
      }
      case "oldCadetCardId":
      case "oldGroceryCardId":
      case "oldLiquorCardId":
      case "oldLiquorGroceryCardId": {
        if (activeConfig.hasApplicationType === false) return "";
        if (allValues.applicationType === "reapplying") {
          if (allValues.selectedFormType === "agniveer") {
            const hasLiquor = allValues.cardApplied?.includes("Liquor");
            const hasGrocery = allValues.cardApplied?.includes("Grocery");
            if (field === "oldLiquorCardId" && hasLiquor) {
              if (!value || !value.trim()) return "Old Liquor Card ID is required when reapplying.";
              if (value.trim().length < 2) return "Please enter a valid Old Liquor Card ID.";
            }
            if (field === "oldGroceryCardId" && hasGrocery) {
              if (!value || !value.trim()) return "Old Grocery Card ID is required when reapplying.";
              if (value.trim().length < 2) return "Please enter a valid Old Grocery Card ID.";
            }
            if (field === "oldLiquorGroceryCardId" && !hasLiquor && !hasGrocery) {
              if (!value || !value.trim()) return "Old Card ID is required when reapplying.";
              if (value.trim().length < 2) return "Please enter a valid Old Card ID.";
            }
          } else {
            if (!value || !value.trim()) return "Old Card ID is required when reapplying.";
            if (value.trim().length < 2) return "Please enter a valid Old Card ID.";
          }
        }
        return "";
      }
      case "substantiveRank": {
        if (allValues.selectedFormType === "agniveer") return "";
        if (activeConfig.rankInputType === "text" || activeConfig.rankInputType === "select") {
          if (!value || !value.trim()) return "Rank is required.";
        }
        return "";
      }
      case "designation": {
        if (activeConfig.rankInputType === "designation" && (!value || !value.trim())) {
          return "Designation is required.";
        }
        return "";
      }
      case "personalNumber": {
        if (!activeConfig.isCivilDefence) {
          if (!value || !value.trim()) return "Personal Number is required.";
          if (!/^[A-Za-z0-9/-]+$/.test(value.trim())) return "Personal Number must be alphanumeric.";
        }
        return "";
      }
      case "cadreOrganisation": {
        if (activeConfig.isCivilDefence && (!value || !value.trim())) {
          return "Current Cadre/Organisation is required.";
        }
        return "";
      }
      case "currentDept": {
        if (activeConfig.isCivilDefence && (!value || !value.trim())) {
          return "Current Department is required.";
        }
        return "";
      }
      case "payAccountNo": {
        if (activeConfig.isCivilDefence && (!value || !value.trim())) {
          return "Pay Account Number is required.";
        }
        return "";
      }
      case "ppoNumber": {
        if (activeConfig.hasPpoNumberAndDate) {
          // If Civil Defence and "Retiring", PPO is optional!
          if (allValues.statusOption === "Retiring") return "";
          if (!value || !value.trim()) {
            return "PPO Number is required for Retired/Widow/NOK personnel.";
          }
        }
        return "";
      }
      case "ppoDate": {
        if (activeConfig.hasPpoNumberAndDate) {
          // If Civil Defence and "Retiring", PPO is optional!
          if (allValues.statusOption === "Retiring") return "";
          if (!value) {
            return "PPO Date is required.";
          }
        }
        return "";
      }
      case "fullName": {
        if (!value || !value.trim()) return "Full Name is required.";
        if (!/^[A-Za-z\s.]+$/.test(value.trim())) return "Full Name should contain letters and spaces only.";
        if (value.trim().length < 2) return "Full Name must be at least 2 characters.";
        return "";
      }
      case "dateOfBirth": {
        return validateDOB(value, true);
      }
      case "panCardNumber": {
        if (!value || !value.trim()) return "PAN Card Number is required.";
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(value.trim())) {
          return "Please enter PAN in the format ABCDE1234F (5 letters, 4 digits, 1 letter).";
        }
        return "";
      }
      case "dateOfJoining": {
        const isCadet = allValues.selectedFormType === "cadetRecruit";
        const isCivil = allValues.selectedFormType === "civilDefenceRetired" || allValues.selectedFormType === "civilDefenceServing";
        const isEsm = allValues.selectedFormType === "esmPensionerWidowNok" || allValues.selectedFormType === "retiringArmedForcesChangeCategory";
        const isServing = allValues.selectedFormType === "servingArmedForces";
        const isRequired = isCadet || isCivil || isEsm || isServing;
        return validateDateOfJoining(value, isRequired, allValues.dateOfBirth);
      }
      case "likelyCommissioningDate": {
        const isCadet = allValues.selectedFormType === "cadetRecruit";
        return validateLikelyCommissioningDate(value, isCadet, allValues.dateOfJoining);
      }
      case "dateOfRetirement": {
        const isCivil = allValues.selectedFormType === "civilDefenceRetired" || allValues.selectedFormType === "civilDefenceServing";
        const isEsm = allValues.selectedFormType === "esmPensionerWidowNok" || allValues.selectedFormType === "retiringArmedForcesChangeCategory";
        const isServing = allValues.selectedFormType === "servingArmedForces";
        const isRequired = isCivil || isEsm || isServing;
        return validateDateOfRetirement(value, isRequired, allValues.dateOfJoining);
      }
      case "dateOfEnrolment": {
        const isAgniveer = allValues.selectedFormType === "agniveer";
        return validateDateOfEnrolment(value, isAgniveer, allValues.dateOfBirth);
      }
      case "dateOfRelease": {
        const isAgniveer = allValues.selectedFormType === "agniveer";
        return validateDateOfRelease(value, allValues.dateOfEnrolment, isAgniveer);
      }
      case "applicantMobile": {
        if (!value || !value.trim()) return "Applicant Mobile Number is required.";
        const mobRegex = /^[6-9][0-9]{9}$/;
        if (!mobRegex.test(value.trim())) {
          return "Please enter a valid 10-digit mobile number.";
        }
        return "";
      }
      case "telNo": {
        if (value && value.trim()) {
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
      case "nokName": {
        if (allValues.selectedFormType === "agniveer") return "";
        if (activeConfig.hasNokName && (!value || !value.trim())) {
          return "Name of NOK is required.";
        }
        if (value && value.trim() && !/^[A-Za-z\s.]+$/.test(value.trim())) {
          return "Name of NOK should contain letters and spaces only.";
        }
        return "";
      }
      case "spouseNokName": {
        if (activeConfig.hasSpouseNokName) {
          if (!value || !value.trim()) {
            return "Spouse / NOK Name is required.";
          }
          if (!/^[A-Za-z\s.]+$/.test(value.trim())) {
            return "Spouse / NOK Name should contain letters and spaces only.";
          }
          if (value.trim().length < 2) {
            return "Spouse / NOK Name must be at least 2 characters.";
          }
        }
        return "";
      }
      case "permanentAddress1": {
        if (activeConfig.hasAddressStep && (!value || !value.trim())) {
          return "Address Line 1 is required.";
        }
        return "";
      }
      case "city": {
        if (activeConfig.hasAddressStep && (!value || !value.trim())) {
          return "City is required.";
        }
        return "";
      }
      case "state": {
        if (activeConfig.hasAddressStep && (!value || !value.trim())) {
          return "State is required.";
        }
        return "";
      }
      case "pin": {
        if (activeConfig.hasAddressStep) {
          if (!value || !value.trim()) return "PIN Code is required.";
          if (!/^[0-9]{6}$/.test(value.trim())) return "Please enter a valid 6-digit PIN code.";
        }
        return "";
      }
      case "dependent1": {
        const isSelected = allValues.cardApplied?.includes("Dependent1");
        if (isSelected) {
          if (!allValues.dependent1Name || !allValues.dependent1Name.trim()) {
            return "Dependent 1 Full Name is required.";
          }
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent1Name.trim())) {
            return "Dependent 1 Name should contain letters and spaces only.";
          }
          if (!allValues.dependent1Relation) return "Please select relation for Dependent 1.";
          const dobErr = validateDependentDOB(allValues.dependent1Dob, true);
          if (dobErr) return dobErr;
        } else if (allValues.dependent1Name && allValues.dependent1Name.trim()) {
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent1Name.trim())) {
            return "Dependent 1 Name should contain letters and spaces only.";
          }
          if (!allValues.dependent1Relation) return "Please select relation for Dependent 1.";
          const dobErr = validateDependentDOB(allValues.dependent1Dob, true);
          if (dobErr) return dobErr;
        }
        return "";
      }
      case "dependent2": {
        const isSelected = allValues.cardApplied?.includes("Dependent2");
        if (isSelected) {
          if (!allValues.dependent2Name || !allValues.dependent2Name.trim()) {
            return "Dependent 2 Full Name is required.";
          }
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent2Name.trim())) {
            return "Dependent 2 Name should contain letters and spaces only.";
          }
          if (!allValues.dependent2Relation) return "Please select relation for Dependent 2.";
          const dobErr = validateDependentDOB(allValues.dependent2Dob, true);
          if (dobErr) return dobErr;
        } else if (allValues.dependent2Name && allValues.dependent2Name.trim()) {
          if (!/^[A-Za-z\s.]+$/.test(allValues.dependent2Name.trim())) {
            return "Dependent 2 Name should contain letters and spaces only.";
          }
          if (!allValues.dependent2Relation) return "Please select relation for Dependent 2.";
          const dobErr = validateDependentDOB(allValues.dependent2Dob, true);
          if (dobErr) return dobErr;
        }
        return "";
      }
      case "dependent1Name": {
        const isSelected = allValues.cardApplied?.includes("Dependent1");
        if (isSelected && (!value || !value.trim())) return "Dependent 1 Full Name is required.";
        if (value && !/^[A-Za-z\s.]+$/.test(value.trim())) return "Dependent 1 Name should contain letters and spaces only.";
        return "";
      }
      case "dependent1Relation": {
        const isSelected = allValues.cardApplied?.includes("Dependent1");
        if (isSelected && !value) return "Please select relation for Dependent 1.";
        return "";
      }
      case "dependent1Dob": {
        const isSelected = allValues.cardApplied?.includes("Dependent1");
        return validateDependentDOB(value, isSelected);
      }
      case "dependent2Name": {
        const isSelected = allValues.cardApplied?.includes("Dependent2");
        if (isSelected && (!value || !value.trim())) return "Dependent 2 Full Name is required.";
        if (value && !/^[A-Za-z\s.]+$/.test(value.trim())) return "Dependent 2 Name should contain letters and spaces only.";
        return "";
      }
      case "dependent2Relation": {
        const isSelected = allValues.cardApplied?.includes("Dependent2");
        if (isSelected && !value) return "Please select relation for Dependent 2.";
        return "";
      }
      case "dependent2Dob": {
        const isSelected = allValues.cardApplied?.includes("Dependent2");
        return validateDependentDOB(value, isSelected);
      }
      default:
        return "";
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 3) {
      const catErr = validateField("selectedFormType", form.selectedFormType);
      if (catErr) stepErrors.selectedFormType = catErr;
      const cErr = validateField("captcha", captchaInput);
      if (cErr) stepErrors.captcha = cErr;
    } else if (step === 4) {
      const fieldsToValidate = ["service"];
      if (activeConfig.hasStatusCheckboxes) fieldsToValidate.push("statusOption");
      if (activeConfig.hasApplicantCategory) fieldsToValidate.push("applicantCategory");
      if (activeConfig.hasCategoryOfPersonnel) fieldsToValidate.push("cardCategory");
      if (activeConfig.hasPayLevel) fieldsToValidate.push("payLevel");
      if (activeConfig.hasCardsApplied) fieldsToValidate.push("cardApplied");
      if (activeConfig.hasPresentlyHeldCardNo) fieldsToValidate.push("heldCardNo");

      fieldsToValidate.forEach((f) => {
        const err = validateField(f, form[f]);
        if (err) stepErrors[f] = err;
      });

      // URC is optional, but validate format if entered
      if (form.urcNo && form.urcNo.trim()) {
        const err = validateField("urcNo", form.urcNo);
        if (err) stepErrors.urcNo = err;
      }
      if (form.urcName && form.urcName.trim()) {
        const err = validateField("urcName", form.urcName);
        if (err) stepErrors.urcName = err;
      }
    } else if (step === 5) {
      const isCivil = activeConfig.isCivilDefence || form.selectedFormType === "civilDefenceRetired" || form.selectedFormType === "civilDefenceServing";
      const fieldsToValidate = [
        "fullName",
        "dateOfBirth",
        "panCardNumber",
        "applicantMobile",
        "email",
        "gender",
        "fatherName",
      ];
      if (activeConfig.hasApplicationType !== false) {
        fieldsToValidate.push("applicationType");
      }
      if (activeConfig.hasNokName && form.selectedFormType !== "agniveer") {
        fieldsToValidate.push("nokName");
      }
      if (activeConfig.hasSpouseNokName) {
        fieldsToValidate.push("spouseNokName");
      }
      if (activeConfig.rankInputType === "text" || activeConfig.rankInputType === "select") {
        if (form.selectedFormType !== "agniveer") {
          fieldsToValidate.push("substantiveRank");
        }
      }
      if (activeConfig.rankInputType === "designation") {
        fieldsToValidate.push("designation");
      }
      if (!activeConfig.isCivilDefence) {
        fieldsToValidate.push("personalNumber");
      } else {
        fieldsToValidate.push("cadreOrganisation", "currentDept", "payAccountNo");
        if (activeConfig.hasPpoNumberAndDate && form.statusOption !== "Retiring") {
          fieldsToValidate.push("ppoNumber", "ppoDate");
        }
      }

      // Specific category date mandatories
      if (form.selectedFormType === "cadetRecruit") {
        fieldsToValidate.push("dateOfJoining", "likelyCommissioningDate");
      } else if (form.selectedFormType === "agniveer") {
        fieldsToValidate.push("dateOfEnrolment", "dateOfRelease");
      } else if (
        form.selectedFormType === "civilDefenceRetired" ||
        form.selectedFormType === "civilDefenceServing" ||
        form.selectedFormType === "esmPensionerWidowNok" ||
        form.selectedFormType === "retiringArmedForcesChangeCategory" ||
        form.selectedFormType === "servingArmedForces"
      ) {
        fieldsToValidate.push("dateOfJoining", "dateOfRetirement");
      }

      // Reapplying old card validation
      if (activeConfig.hasApplicationType !== false && form.applicationType === "reapplying") {
        if (form.selectedFormType === "agniveer") {
          const hasLiquor = form.cardApplied?.includes("Liquor");
          const hasGrocery = form.cardApplied?.includes("Grocery");
          if (hasLiquor) fieldsToValidate.push("oldLiquorCardId");
          if (hasGrocery) fieldsToValidate.push("oldGroceryCardId");
          if (!hasLiquor && !hasGrocery) fieldsToValidate.push("oldLiquorGroceryCardId");
        } else if (activeConfig.reapplyingOldCardField) {
          fieldsToValidate.push(activeConfig.reapplyingOldCardField);
        }
      }

      fieldsToValidate.forEach((f) => {
        const err = validateField(f, form[f]);
        if (err) stepErrors[f] = err;
      });
    } else if (step === 6) {
      if (activeConfig.hasAddressStep) {
        ["permanentAddress1", "city", "state", "pin", "telNo"].forEach((f) => {
          const err = validateField(f, form[f]);
          if (err) stepErrors[f] = err;
        });
      }
    } else if (step === 7) {
      if (activeConfig.hasDependentsStep) {
        const dep1Err = validateField("dependent1", null, form);
        if (dep1Err) {
          stepErrors.dependent1 = dep1Err;
          stepErrors.dependent1Name = validateField("dependent1Name", form.dependent1Name, form);
          stepErrors.dependent1Relation = validateField("dependent1Relation", form.dependent1Relation, form);
          stepErrors.dependent1Dob = validateField("dependent1Dob", form.dependent1Dob, form);
        }
        const dep2Err = validateField("dependent2", null, form);
        if (dep2Err) {
          stepErrors.dependent2 = dep2Err;
          stepErrors.dependent2Name = validateField("dependent2Name", form.dependent2Name, form);
          stepErrors.dependent2Relation = validateField("dependent2Relation", form.dependent2Relation, form);
          stepErrors.dependent2Dob = validateField("dependent2Dob", form.dependent2Dob, form);
        }
      }
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
    setErrors((prev) => {
      const next = { ...prev, [field]: err };
      if (field === "dateOfBirth") {
        if (form.dateOfJoining || touched.dateOfJoining) {
          next.dateOfJoining = validateField("dateOfJoining", form.dateOfJoining, form);
        }
        if (form.dateOfEnrolment || touched.dateOfEnrolment) {
          next.dateOfEnrolment = validateField("dateOfEnrolment", form.dateOfEnrolment, form);
        }
      }
      return next;
    });
  };

  const goToNextStep = (currentStepNum) => {
    const result = validateStep(currentStepNum);
    if (result.isValid) {
      const nextStepNum = getNextStepNum(currentStepNum);
      setWizardStep(nextStepNum);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const stepFields = Object.keys(result.errors);
      const newTouched = {};
      stepFields.forEach((k) => {
        newTouched[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...newTouched }));
    }
  };

  const goToPrevStep = (currentStepNum) => {
    const prevStepNum = getPrevStepNum(currentStepNum);
    setWizardStep(prevStepNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveWizardToLocalStorage = async (options = { notify: false }) => {
    try {
      const payload = {
        currentStep: wizardStep,
        form: {
          ...form,
          substantiveRank: form.selectedFormType === "agniveer" ? "AGNIVEER" : form.substantiveRank,
          applicationDate: form.applicationDate || getTodayIsoDate(),
          applicationNumber: form.applicationNumber,
          selectedFormType: form.selectedFormType,
        },
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(payload));
      if (options.notify) setDraftMessage("Draft saved successfully.");
    } catch {
      if (options.notify) setDraftMessage("Unable to save draft.");
    }
  };

  const loadWizardFromLocalStorage = (appNumberOverride = null) => {
    try {
      const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.form) {
        const stored = parsed.form;
        const merged = { ...emptyForm, ...stored };

        if (!merged.applicationDate) {
          merged.applicationDate = getTodayIsoDate();
        } else {
          merged.applicationDate = normalizeDateOnly(merged.applicationDate) || getTodayIsoDate();
        }

        if (merged.selectedFormType === "agniveer" && !merged.substantiveRank) {
          merged.substantiveRank = "AGNIVEER";
        }

        // If the draft was for a first-time application, ensure no stale old-card data
        if (merged.applicationType === "firstTime") {
          merged.oldLiquorGroceryCardId = "";
          merged.oldCadetCardId = "";
          merged.oldGroceryCardId = "";
          merged.oldLiquorCardId = "";
        }

        // For categories without applicationType (Retiring Armed Forces and Civil Defence), ensure applicationType is cleared and old cards are removed
        if (
          merged.selectedFormType === "retiringArmedForcesChangeCategory" ||
          merged.selectedFormType === "civilDefenceRetired" ||
          merged.selectedFormType === "civilDefenceServing"
        ) {
          merged.applicationType = "";
          OLD_CARD_FIELDS.forEach((f) => { merged[f] = ""; });
        }

        if (appNumberOverride) {
          merged.applicationNumber = appNumberOverride;
        }

        setForm(merged);
      }
      if (parsed.currentStep && parsed.currentStep >= 2 && parsed.currentStep <= 8) {
        setWizardStep(parsed.currentStep);
      }
    } catch {
      setLoadError("Failed to load saved draft.");
    }
  };

  // On mount: initialize application number & restore saved draft
  const initRan = useRef(false);
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    generateCaptcha();

    const sessionCached = sessionStorage.getItem(APP_NUMBER_SESSION_KEY);
    if (sessionCached) {
      console.log(`[APP NUMBER] Refresh — reusing active number: ${sessionCached}`);
      loadWizardFromLocalStorage();
      setForm((current) => ({ ...current, applicationNumber: sessionCached }));
      return;
    }

    const initNewSession = async () => {
      const num = await fetchNextApplicationNumber();
      if (num) {
        console.log(`[APP NUMBER] Allocated new number: ${num}`);
        sessionStorage.setItem(APP_NUMBER_SESSION_KEY, num);
        loadWizardFromLocalStorage(num);
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

  // Auto-save form to localStorage
  useEffect(() => {
    const id = setTimeout(() => {
      saveWizardToLocalStorage();
    }, 650);
    return () => clearTimeout(id);
  }, [form, wizardStep]);

  // Close Important Instructions modal on Escape
  useEffect(() => {
    if (!showInstructionsModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowInstructionsModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showInstructionsModal]);

  const update = (key, value) => {
    // When switching to "firstTime", clear all old-card values, errors, and touched state
    if (key === "applicationType" && value === "firstTime") {
      setForm((current) => {
        const cleared = {};
        OLD_CARD_FIELDS.forEach((f) => { cleared[f] = ""; });
        return { ...current, [key]: value, ...cleared };
      });
      setErrors((prev) => {
        const next = { ...prev };
        OLD_CARD_FIELDS.forEach((f) => { next[f] = ""; });
        return next;
      });
      setTouched((prev) => {
        const next = { ...prev };
        OLD_CARD_FIELDS.forEach((f) => { next[f] = false; });
        return next;
      });
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));

    // Immediate cross-field validation for DOB, DOJ, and DOE
    if (key === "dateOfBirth") {
      const nextValues = { ...form, [key]: value };
      const dobErr = validateField("dateOfBirth", value, nextValues);
      setErrors((prev) => {
        const next = { ...prev, dateOfBirth: dobErr };
        if (form.dateOfJoining || touched.dateOfJoining) {
          next.dateOfJoining = validateField("dateOfJoining", form.dateOfJoining, nextValues);
        }
        if (form.dateOfEnrolment || touched.dateOfEnrolment) {
          next.dateOfEnrolment = validateField("dateOfEnrolment", form.dateOfEnrolment, nextValues);
        }
        return next;
      });
      return;
    }

    if (key === "dateOfJoining" || key === "dateOfEnrolment") {
      const nextValues = { ...form, [key]: value };
      const err = validateField(key, value, nextValues);
      setErrors((prev) => ({ ...prev, [key]: err }));
      return;
    }

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

  const isPrintedRef = useRef(false);
  const handlePrint = () => {
    const appNum = form.applicationNumber;
    console.log(`[APP NUMBER] Printing: ${appNum}`);

    const onAfterPrint = () => {
      window.removeEventListener("afterprint", onAfterPrint);
      if (!isPrintedRef.current) {
        isPrintedRef.current = true;
        setForm((current) => ({ ...current, isPrinted: true }));
      }
    };

    window.addEventListener("afterprint", onAfterPrint);
    window.print();
  };

  const resetForm = async () => {
    sessionStorage.removeItem(APP_NUMBER_SESSION_KEY);
    localStorage.removeItem(WIZARD_STORAGE_KEY);
    isPrintedRef.current = false;

    setForm({ ...emptyForm, applicationDate: getTodayIsoDate() });
    setErrors({});
    setTouched({});
    setDraftMessage("");
    setLoadError("");
    generateCaptcha();
    setWizardStep(2);

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

  // Find step visual index for the stepper
  const currentStepVisualIdx = activeSteps.findIndex((s) => s.num === wizardStep);

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
          ===================================================================== */}
      <div className="no-print" role="region" aria-label="Application Wizard">
        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: IMPORTANT INSTRUCTIONS / LANDING HERO (100% UNCHANGED)      */}
        {/* ------------------------------------------------------------------ */}
        {wizardStep === 2 && (
          <div className="wz-instructions-wrapper">
            <section className="wz-landing-hero">
              <h1 className="wz-landing-title">
                Canteen Smart Card — Application Form Filling Portal
              </h1>
              <p className="wz-landing-subtitle">
                Fill for your Liquor, Grocery, or Dependent Canteen Smart Card
                entirely online. Fill in your details once, generate a
                print-ready application, and submit it at your nearest URC /
                Canteen.
              </p>

              <div className="wz-landing-highlights">
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">🎖️</span>
                  <div>
                    <div className="wz-landing-highlight-title">Who can apply</div>
                    <div className="wz-landing-highlight-text">
                      ESM, Widow, NOK, EC, WW Veteran &amp; SSC personnel of the
                      Army, Navy, Air Force and allied forces
                    </div>
                  </div>
                </div>
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">💳</span>
                  <div>
                    <div className="wz-landing-highlight-title">Card types</div>
                    <div className="wz-landing-highlight-text">
                      Liquor, Grocery, and up to two Dependent cards per
                      application
                    </div>
                  </div>
                </div>
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">🔄</span>
                  <div>
                    <div className="wz-landing-highlight-title">Validity</div>
                    <div className="wz-landing-highlight-text">
                      10 years from date of issue — renew annually at your
                      nearest canteen
                    </div>
                  </div>
                </div>
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">📝</span>
                  <div>
                    <div className="wz-landing-highlight-title">How it works</div>
                    <div className="wz-landing-highlight-text">
                      Fill the form online, print the generated application,
                      attach an attested photo, and submit it at your canteen
                    </div>
                  </div>
                </div>
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">👨‍👩‍👧</span>
                  <div>
                    <div className="wz-landing-highlight-title">Dependent card rules</div>
                    <div className="wz-landing-highlight-text">
                      Children above 10 years are eligible; sons over 25 are
                      not authorised; no age limit for widowed/divorced
                      daughters
                    </div>
                  </div>
                </div>
                <div className="wz-landing-highlight-item">
                  <span className="wz-landing-highlight-icon">✉️</span>
                  <div>
                    <div className="wz-landing-highlight-title">Need help?</div>
                    <div className="wz-landing-highlight-text">
                      No SMS update? Write to customercare@cims-net.com with
                      your payment and personal details
                    </div>
                  </div>
                </div>
              </div>

              <div className="wz-landing-cta-row">
                <button
                  type="button"
                  className="wz-btn-secondary wz-landing-cta"
                  onClick={() => setShowInstructionsModal(true)}
                >
                  View Important Instructions
                </button>
                <button
                  type="button"
                  className="wz-btn-primary wz-landing-cta"
                  onClick={() => setWizardStep(3)}
                >
                  Proceed to Application Form →
                </button>
              </div>
            </section>

            {showInstructionsModal && (
              <div
                className="wz-modal-overlay"
                role="presentation"
                onClick={() => setShowInstructionsModal(false)}
              >
                <div
                  className="wz-modal-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="important-instructions-heading"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="wz-modal-close"
                    aria-label="Close"
                    onClick={() => setShowInstructionsModal(false)}
                  >
                    ×
                  </button>

                  <div className="wz-instructions-title-pill" id="important-instructions-heading">Important Instructions</div>

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
                      onClick={() => {
                        setShowInstructionsModal(false);
                        setWizardStep(3);
                      }}
                    >
                      I Understand, Proceed →
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              {activeSteps.map(({ num, label }, index) => (
                <div
                  key={num}
                  className={`wz-step-node ${wizardStep === num ? "active" : ""} ${currentStepVisualIdx > index ? "done" : ""}`}
                >
                  <div className="wz-step-circle">
                    {currentStepVisualIdx > index ? "✓" : index + 1}
                  </div>
                  <div className="wz-step-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Category Banner in Steps 4+ */}
            {wizardStep >= 4 && form.selectedFormType && (
              <div className="wz-active-category-banner">
                <div className="wz-active-cat-left">
                  <span className="wz-active-cat-label">APPLICATION TYPE</span>
                  <span className="wz-active-cat-title">
                    {FORM_CATEGORIES.find((c) => c.id === form.selectedFormType)?.title || form.selectedFormType}
                  </span>
                </div>
                <button
                  type="button"
                  className="wz-change-cat-btn"
                  onClick={() => {
                    const hasData = form.urcNo || form.personalNumber || form.fullName || form.applicantMobile;
                    if (hasData) {
                      if (!confirm("Changing the application form category will return to category selection. Are you sure you want to change the form category?")) {
                        return;
                      }
                    }
                    setWizardStep(3);
                  }}
                >
                  ← Change Form Category
                </button>
              </div>
            )}

            {/* ======================== STEP 3: CAPTCHA + Category Selection ======================== */}
            {wizardStep === 3 && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Verification &amp; Form Selection</div>
                    <div className="wz-card-topbar-sub">Step 1 of {activeSteps.length} — Select official category &amp; security check</div>
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
                      New Form
                    </button>
                  </div>
                </div>

                <div className="wz-card-body">
                  {/* Category Selection Component */}
                  <CategorySelector
                    selectedFormType={form.selectedFormType}
                    onSelectCategory={handleCategorySelect}
                    errorMessage={errors.selectedFormType}
                    isTouched={touched.selectedFormType}
                  />

                  {/* Security Verification (CAPTCHA) */}
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
                              goToNextStep(3);
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
                      onClick={() => goToNextStep(3)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEPS 4, 5, 6, 7: DYNAMIC FORM STEPS ======================== */}
            {[4, 5, 6, 7].includes(wizardStep) && (
              <div className="wz-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">
                      {wizardStep === 4 && "URC, Service & Entitlement Details"}
                      {wizardStep === 5 && "Personal & Service Particulars"}
                      {wizardStep === 6 && (form.selectedFormType.startsWith("civilDefence") ? "Contact Address Details" : "Permanent Address Details")}
                      {wizardStep === 7 && "Dependent Information"}
                    </div>
                    <div className="wz-card-topbar-sub">
                      Step {currentStepVisualIdx + 1} of {activeSteps.length}
                    </div>
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
                      New Form
                    </button>
                  </div>
                </div>

                <div className="wz-card-body">
                  <DynamicStepContent
                    step={wizardStep}
                    selectedFormType={form.selectedFormType}
                    form={form}
                    update={update}
                    toggleArray={toggleArray}
                    handleBlur={handleBlur}
                    touched={touched}
                    errors={errors}
                  />
                </div>

                <div className="wz-nav-footer">
                  <div className="wz-nav-left">
                    <button className="wz-btn-secondary" type="button" onClick={() => goToPrevStep(wizardStep)}>
                      ← Previous
                    </button>
                  </div>
                  <div className="wz-nav-right">
                    <button
                      id={`step${wizardStep}-next-btn`}
                      className="wz-btn-primary"
                      type="button"
                      onClick={() => goToNextStep(wizardStep)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================== STEP 8: Final Action Stage ======================== */}
            {wizardStep === 8 && (
              <div className="wz-card wz-final-action-card">
                <div className="wz-card-topbar">
                  <div>
                    <div className="wz-card-topbar-title">Application Finalisation</div>
                    <div className="wz-card-topbar-sub">Step {activeSteps.length} of {activeSteps.length} — Review and print the official 2-page document</div>
                  </div>
                </div>

                <div className="wz-card-body wz-final-action-body">
                  <div className="wz-final-summary-box">
                    <div className="wz-final-icon">✅</div>
                    <h3 className="wz-final-title">Application Form Completed</h3>
                    <p className="wz-final-desc">
                      Your Canteen Smart Card application form for <strong>{FORM_CATEGORIES.find((c) => c.id === form.selectedFormType)?.title || form.selectedFormType}</strong> is ready. Print the official 2-page tabular summary to sign, paste physical photographs, and submit to your designated URC / Canteen.
                    </p>
                    <div className="wz-app-num-pill">
                      Application No: <strong>{form.applicationNumber || `${activeConfig.prefix}-Pending`}</strong>
                    </div>
                  </div>
                </div>

                <div className="wz-nav-footer wz-final-footer">
                  <div className="wz-final-button-group">
                    <button
                      id="final-prev-btn"
                      className="wz-btn-secondary"
                      type="button"
                      onClick={() => goToPrevStep(8)}
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
          ===================================================================== */}
      <PrintableApplication form={form} selectedFormType={form.selectedFormType} />
    </div>
  );
}
