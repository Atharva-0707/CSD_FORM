import React from "react";
import { FORM_CONFIGS } from "../formConfigs";

function isoToDisplay(iso) {
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

export default function PrintableApplication({ form, selectedFormType }) {
  const config = FORM_CONFIGS[selectedFormType] || FORM_CONFIGS.esmPensionerWidowNok;

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

  const appNumberDisplay = form.applicationNumber || `${config.prefix}-0000000`;

  return (
    <div className="printable-summary-container print-only">
      {/* =================================================================== */}
      {/* PAGE 1 OF 2                                                         */}
      {/* =================================================================== */}
      <div className="print-page print-page-1">
        {/* Main Header */}
        <header className="pr-page-header">
          <div className="pr-header-top-row">
            <div className="pr-header-badge">CANTEEN SERVICES DIRECTORATE &bull; QMG BRANCH</div>
            <div className="pr-header-appno">
              Application No: <strong>{appNumberDisplay}</strong>
            </div>
          </div>
          <h1 className="pr-main-title">{config.officialTitle}</h1>
          {config.officialSubtitle && (
            <div className="pr-main-subtitle">{config.officialSubtitle}</div>
          )}
          {config.headerNote && (
            <div className="pr-header-note" style={{ fontSize: "8px", fontStyle: "italic", marginTop: "1px", textAlign: "center", width: "100%" }}>
              {config.headerNote}
            </div>
          )}
          <div className="pr-instructions-bar">
            Please read instructions carefully before filling Application Form. Use Black ball pens only. Fields marked* are mandatory. Fill in CAPITAL only.
          </div>
        </header>

        {/* Top Boxes Section */}
        <div className="pr-top-boxes-grid">
          {/* Status Checkboxes for Civil Defence Retired */}
          {config.hasStatusCheckboxes && (
            <div className="pr-status-checkboxes-box" style={{ border: "1.2px solid #000", padding: "4px", fontSize: "8.5px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
              <div style={{ fontWeight: "bold", textAlign: "center", borderBottom: "1px solid #000", paddingBottom: "2px" }}>STATUS</div>
              {config.statusOptions.map((st) => (
                <div key={st} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>{form.statusOption === st ? "☑" : "☐"}</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          )}

          {/* Photos */}
          {config.photos.map((ph, idx) => (
            <div key={idx} className="pr-photo-box">
              <div className="pr-photo-box-header">{ph.title}</div>
              <div className="pr-photo-box-body">
                <div className="pr-photo-box-main-text">{ph.line1}</div>
                {ph.line2 && <div className="pr-photo-box-note">{ph.line2}</div>}
                {ph.line3 && <div className="pr-photo-box-note">{ph.line3}</div>}
              </div>
              <div className="pr-photo-box-footer">{ph.footer}</div>
            </div>
          ))}

          {/* Primary Applicant Signature Area */}
          <div className="pr-sig-box">
            <div className="pr-sig-box-header">Sign inside the box (Primary Applicant only)</div>
            <div className="pr-sig-blank-area"></div>
            {config.hasApplicationType !== false && (
              <div className="pr-apply-type-row">
                <span className="pr-apply-type-opt">{form.applicationType === "firstTime" ? "☑" : "☐"} *Applying 1st time</span>
                <span className="pr-apply-type-opt">{form.applicationType === "reapplying" ? "☑" : "☐"} *Reapplying</span>
              </div>
            )}
            <div className="pr-sig-box-footer">(If applying for both categories, use two separate forms)</div>
          </div>

          {/* Application Number Official Box */}
          <div className="pr-appnum-box">
            <div className="pr-appnum-box-header">Application Number</div>
            <div className="pr-appnum-prefix" style={{ fontSize: "14px", fontWeight: "900", color: "#b91c1c" }}>
              {config.prefix}
            </div>
            <div className="pr-appnum-value" style={{ fontSize: "13px" }}>
              {form.applicationNumber || "Pending"}
            </div>
            <div className="pr-appnum-date">
              Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
            </div>
            <div className="pr-appnum-note">Official System Record</div>
          </div>
        </div>

        {/* Structured 4-Column Table */}
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
              <td colSpan={4}>
                {selectedFormType === "cadetRecruit"
                  ? "FOR USE OF URC STAFF"
                  : "1. APPLICATION & URC DETAILS"}
              </td>
            </tr>
            <tr>
              <td className="pr-field-cell">Application Date</td>
              <td className="pr-val-cell font-bold" colSpan={config.hasApplicationType !== false ? 1 : 3}>
                {isoToDisplay(form.applicationDate)}
              </td>
              {config.hasApplicationType !== false && (
                <>
                  <td className="pr-field-cell">Application Type</td>
                  <td className="pr-val-cell">{appTypeDisplay}</td>
                </>
              )}
            </tr>
            {config.hasApplicationType !== false && form.applicationType === "reapplying" && (
              <tr>
                <td className="pr-field-cell">{config.reapplyingOldCardLabel}</td>
                <td className="pr-val-cell font-bold" colSpan={3}>
                  {selectedFormType === "agniveer" && form.cardApplied?.includes("Liquor") && form.cardApplied?.includes("Grocery")
                    ? `Liquor Card: ${getVal(form.oldLiquorCardId)} | Grocery Card: ${getVal(form.oldGroceryCardId)}`
                    : getVal(form[config.reapplyingOldCardField] || form.oldLiquorCardId || form.oldGroceryCardId)}
                </td>
              </tr>
            )}
            <tr>
              <td className="pr-field-cell">URC No.</td>
              <td className="pr-val-cell font-bold">-</td>
              <td className="pr-field-cell">URC Name</td>
              <td className="pr-val-cell font-bold">-</td>
            </tr>

            {/* Section 2: Service & Card Particulars */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>2. SERVICE &amp; CARD DETAILS</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Service Branch</td>
              <td className="pr-val-cell font-bold">
                {getVal(form.service)}
                {form.service === "MoD" && form.modDepartment
                  ? ` (Dept: ${form.modDepartment}${form.modDepartment === "Others" && form.modDeptOther ? ` - ${form.modDeptOther}` : ""})`
                  : ""}
              </td>
              <td className="pr-field-cell">
                {config.isCivilDefence
                  ? "Category of Pay Level"
                  : config.hasPayLevel
                  ? "Pay Level"
                  : "Rank / Designation"}
              </td>
              <td className="pr-val-cell font-bold">
                {config.hasPayLevel ? getVal(form.payLevel) : selectedFormType === "agniveer" ? "AGNIVEER" : getVal(form.substantiveRank || form.designation)}
              </td>
            </tr>

            {/* Conditional service sub-categories or force details */}
            {form.serviceSubCategory && form.serviceSubCategory.length > 0 && (
              <tr>
                <td className="pr-field-cell">Selected Force / Subcategory</td>
                <td className="pr-val-cell font-bold" colSpan={3}>
                  {getVal(form.serviceSubCategory)}
                </td>
              </tr>
            )}

            {/* Applicant & Personnel Categories (if applicable) */}
            {(config.hasApplicantCategory || config.hasCategoryOfPersonnel || config.hasCardsApplied) && (
              <tr>
                {config.hasApplicantCategory && (
                  <>
                    <td className="pr-field-cell">{config.applicantCategoryLabel || "Applicant Category"}</td>
                    <td className="pr-val-cell font-bold">{getVal(form.applicantCategory)}</td>
                  </>
                )}
                {config.hasCategoryOfPersonnel && (
                  <>
                    <td className="pr-field-cell">{config.personnelCategoryLabel || "Category"}</td>
                    <td className="pr-val-cell font-bold">{getVal(form.cardCategory)}</td>
                  </>
                )}
                {!config.hasApplicantCategory && config.hasCardsApplied && (
                  <>
                    <td className="pr-field-cell">Card(s) Applied For</td>
                    <td className="pr-val-cell font-bold">{getVal(form.cardApplied)}</td>
                  </>
                )}
              </tr>
            )}

            {/* When both applicantCategory & categoryOfPersonnel are present, cardsApplied goes on next line */}
            {config.hasApplicantCategory && config.hasCardsApplied && (
              <tr>
                <td className="pr-field-cell">Card(s) Applied For</td>
                <td className="pr-val-cell font-bold" colSpan={config.hasPresentlyHeldCardNo ? 1 : 3}>
                  {getVal(form.cardApplied)}
                </td>
                {config.hasPresentlyHeldCardNo && (
                  <>
                    <td className="pr-field-cell">Card No. Presently Held</td>
                    <td className="pr-val-cell font-bold">{getVal(form.heldCardNo)}</td>
                  </>
                )}
              </tr>
            )}

            {/* Section 3: Personal & Service Record */}
            <tr className="pr-section-header-row">
              <td colSpan={4}>3. PERSONAL &amp; SERVICE RECORD</td>
            </tr>
            <tr>
              <td className="pr-field-cell">Full Name (Capital Letters)</td>
              <td className="pr-val-cell font-bold" colSpan={3}>{getVal(form.fullName)}</td>
            </tr>
            <tr>
              <td className="pr-field-cell">
                {config.isCivilDefence ? "Designation" : config.rankLabel || "Rank"}
              </td>
              <td className="pr-val-cell font-bold">
                {selectedFormType === "agniveer" ? "AGNIVEER" : getVal(form.substantiveRank || form.designation)}
              </td>
              <td className="pr-field-cell">
                {config.isCivilDefence ? "Pay Account No." : "Personal Number"}
              </td>
              <td className="pr-val-cell font-bold">
                {getVal(config.isCivilDefence ? form.payAccountNo : form.personalNumber)}
              </td>
            </tr>

            {/* Serving Armed Forces: Old Personal No */}
            {config.hasOldPersonalNumber && form.oldPersonalNumber && (
              <tr>
                <td className="pr-field-cell">Old Personal No. (Promotion)</td>
                <td className="pr-val-cell font-bold" colSpan={3}>{getVal(form.oldPersonalNumber)}</td>
              </tr>
            )}

            {/* Civil Defence: Cadre, Dept, Deputation */}
            {config.isCivilDefence && (
              <>
                <tr>
                  <td className="pr-field-cell">Posted Cadre / Organisation</td>
                  <td className="pr-val-cell font-bold">{getVal(form.cadreOrganisation)}</td>
                  <td className="pr-field-cell">Current Dept.</td>
                  <td className="pr-val-cell font-bold">{getVal(form.currentDept)}</td>
                </tr>
                {form.parentCadre && (
                  <tr>
                    <td className="pr-field-cell">Parent Cadre / Dept (Deputation)</td>
                    <td className="pr-val-cell" colSpan={3}>
                      {getVal(form.parentCadre)} {form.deputationDept ? `| Dept: ${form.deputationDept}` : ""}{" "}
                      {form.deputationFrom ? `| From: ${isoToDisplay(form.deputationFrom)}` : ""}{" "}
                      {form.deputationTo ? `To: ${isoToDisplay(form.deputationTo)}` : ""}
                    </td>
                  </tr>
                )}
              </>
            )}

            <tr>
              <td className="pr-field-cell">Date of Birth</td>
              <td className="pr-val-cell font-bold">{isoToDisplay(form.dateOfBirth)}</td>
              <td className="pr-field-cell">PAN Card Number</td>
              <td className="pr-val-cell font-bold">{getVal(form.panCardNumber)}</td>
            </tr>

            {/* Category specific dates */}
            <tr>
              {config.serviceDateLabels?.dateOfEnrolment ? (
                <>
                  <td className="pr-field-cell">{config.serviceDateLabels.dateOfEnrolment}</td>
                  <td className="pr-val-cell font-bold">{isoToDisplay(form.dateOfEnrolment)}</td>
                  <td className="pr-field-cell">{config.serviceDateLabels.dateOfRelease}</td>
                  <td className="pr-val-cell font-bold">{isoToDisplay(form.dateOfRelease)}</td>
                </>
              ) : config.serviceDateLabels?.likelyCommissioningDate ? (
                <>
                  <td className="pr-field-cell">{config.serviceDateLabels.dateOfJoining}</td>
                  <td className="pr-val-cell">{isoToDisplay(form.dateOfJoining)}</td>
                  <td className="pr-field-cell">{config.serviceDateLabels.likelyCommissioningDate}</td>
                  <td className="pr-val-cell font-bold">{isoToDisplay(form.likelyCommissioningDate)}</td>
                </>
              ) : (
                <>
                  <td className="pr-field-cell">{config.serviceDateLabels?.dateOfJoining || "Date of Joining"}</td>
                  <td className="pr-val-cell">{isoToDisplay(form.dateOfJoining)}</td>
                  <td className="pr-field-cell">{config.serviceDateLabels?.dateOfRetirement || "Date of Retirement"}</td>
                  <td className="pr-val-cell">{isoToDisplay(form.dateOfRetirement)}</td>
                </>
              )}
            </tr>

            {/* PPO details if applicable */}
            {(config.hasPpoNumber || config.hasPpoNumberAndDate) && (
              <tr>
                <td className="pr-field-cell">PPO Number</td>
                <td className="pr-val-cell font-bold">{getVal(form.ppoNumber)}</td>
                <td className="pr-field-cell">{config.hasPpoNumberAndDate ? "PPO Date" : "Gender & Marital"}</td>
                <td className="pr-val-cell">
                  {config.hasPpoNumberAndDate
                    ? isoToDisplay(form.ppoDate)
                    : `${getVal(form.gender)} • ${getVal(form.maritalStatus)}`}
                </td>
              </tr>
            )}

            <tr>
              <td className="pr-field-cell">Applicant Mobile No.</td>
              <td className="pr-val-cell font-bold">{getVal(form.applicantMobile)}</td>
              <td className="pr-field-cell">Email</td>
              <td className="pr-val-cell">{getVal(form.email)}</td>
            </tr>

            <tr>
              <td className="pr-field-cell">Father's Name</td>
              <td className="pr-val-cell font-bold">{getVal(form.fatherName)}</td>
              <td className="pr-field-cell">{config.hasNokName ? "Name of NOK" : "Name of Spouse / NOK"}</td>
              <td className="pr-val-cell font-bold">{getVal(form.nokName || form.spouseNokName)}</td>
            </tr>

            <tr>
              <td className="pr-field-cell">Gender &amp; Marital Status</td>
              <td className="pr-val-cell" colSpan={3}>
                Gender: <strong>{getVal(form.gender)}</strong> | Marital Status: <strong>{getVal(form.maritalStatus)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Page 1 Bottom: Receipt for Applicant */}
        <div className="pr-receipt-box" style={{ marginTop: "4px" }}>
          <div className="pr-receipt-header-row">
            <span className="pr-receipt-title">RECEIPT FOR APPLICANT (TO BE FILLED BY CANTEEN STAFF)</span>
            <span className="pr-receipt-appno">
              <strong>{config.prefix}</strong> {appNumberDisplay}
            </span>
          </div>
          <div className="pr-receipt-content" style={{ fontSize: "8.2px" }}>
            <div className="pr-receipt-row">
              Received with thanks a sum of Rs. <span className="pr-receipt-fill">{getVal(form.receiptAmount) !== "—" ? form.receiptAmount : "__________"}</span>{" "}
              {config.receiptLines?.showPayAccountNo ? (
                <>Pay Account No.: <span className="pr-receipt-fill">{getVal(form.payAccountNo) !== "—" ? form.payAccountNo : "________________"}</span></>
              ) : (
                <>from Rank: <span className="pr-receipt-fill">{getVal(form.substantiveRank) !== "—" ? form.substantiveRank : "____________________"}</span> Personal No: <span className="pr-receipt-fill">{getVal(form.personalNumber) !== "—" ? form.personalNumber : "________________"}</span></>
              )}
            </div>
            <div className="pr-receipt-row">
              Name: <span className="pr-receipt-fill">{getVal(form.fullName) !== "—" ? form.fullName : "________________________________"}</span>{" "}
              {config.receiptLines?.showDesignation && (
                <>Designation: <span className="pr-receipt-fill">{getVal(form.designation) !== "—" ? form.designation : "________________"}</span> </>
              )}
              {config.receiptLines?.showDepartment && (
                <>Department: <span className="pr-receipt-fill">{getVal(form.currentDept) !== "—" ? form.currentDept : "________________"}</span> </>
              )}
              {config.receiptLines?.showCardsAppliedFrom && (
                <>No. of canteen smart card applied from / for: <span className="pr-receipt-fill">{getVal(form.cardApplied) !== "—" ? form.cardApplied.join(", ") : "Liquor / Grocery"}</span> </>
              )}
              URC Code: <span className="pr-receipt-fill">________</span> Canteen Name: <span className="pr-receipt-fill">____________________</span>
            </div>
            <div className="pr-receipt-row">
              Payment done via: <span className="pr-receipt-fill">{getVal(form.receiptPaymentDoneVia) !== "—" ? form.receiptPaymentDoneVia : "Cash / Card / UTR"}</span> &bull; Cash/Instrument/UTR No: <span className="pr-receipt-fill">{getVal(form.receiptCashInstrumentUtrNo) !== "—" ? form.receiptCashInstrumentUtrNo : "____________________"}</span> &bull; Date: <span className="pr-receipt-fill">__________</span> &bull; Bank: <span className="pr-receipt-fill">{getVal(form.bankName) !== "—" ? form.bankName : "________________"}</span> &bull; Branch: <span className="pr-receipt-fill">{getVal(form.branch) !== "—" ? form.branch : "________________"}</span>
            </div>
            <div className="pr-receipt-bottom-row" style={{ marginTop: "3px" }}>
              <div className="pr-receipt-date-block">
                Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
              </div>
              <div className="pr-receipt-stamp-block">
                <div className="pr-receipt-stamp-frame" style={{ height: "20px" }}></div>
                <div className="pr-receipt-stamp-title">Signature &amp; Stamp of Canteen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="pr-page-footer">
          <div>Canteen Smart Card Portal &bull; Official Tabular Application Record</div>
          <div>Page 1 of 2</div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PAGE 2 OF 2                                                         */}
      {/* =================================================================== */}
      <div className="print-page print-page-2">
        {/* Page 2 Header */}
        <header className="pr-page-header">
          <div className="pr-header-top-row">
            <div className="pr-header-badge">CANTEEN SERVICES DIRECTORATE &bull; QMG BRANCH</div>
            <div className="pr-header-appno">
              Application No: <strong>{appNumberDisplay}</strong>
            </div>
          </div>
          <h1 className="pr-main-title">{config.officialTitle}</h1>
          <div className="pr-main-subtitle">
            DECLARATIONS, ATTESTATIONS &amp; IMPORTANT INSTRUCTIONS (PAGE 2 OF 2)
          </div>
        </header>

        {/* Address Block (if applicable to category) */}
        {config.hasAddressStep && (
          <div className="pr-address-container" style={{ border: "1.2px solid #000", padding: "4px 8px", marginBottom: "4px" }}>
            <div style={{ fontWeight: "800", fontSize: "9px", borderBottom: "1px solid #000", paddingBottom: "2px", marginBottom: "3px" }}>
              {selectedFormType.startsWith("civilDefence") ? "*Contact Address:" : "*Permanent Address"}
            </div>
            <div style={{ fontSize: "8.5px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "6px" }}>
              <div>Address: <strong>{getVal(form.permanentAddress1)} {form.permanentAddress2 ? `, ${form.permanentAddress2}` : ""}</strong></div>
              <div>City: <strong>{getVal(form.city)}</strong></div>
              <div>State: <strong>{getVal(form.state)}</strong></div>
              <div>PIN: <strong>{getVal(form.pin)}</strong> {form.telNo ? `| Tel: ${form.telNo}` : ""}</div>
            </div>
          </div>
        )}

        {/* Dependents Details (if applicable) */}
        {config.hasDependentsStep && (
          <div className="pr-dependents-container" style={{ marginBottom: "4px" }}>
            <div className="pr-section-badge">DEPENDENT DETAILS &amp; PHYSICAL ATTESTATIONS</div>
            <div className="pr-dep-split-layout">
              <div className="pr-dep-table-wrap">
                <table className="pr-data-table pr-dep-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>DEPENDENT</th>
                      <th style={{ width: "65%" }}>ENTERED DETAILS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="pr-sub-header-row"><td colSpan={2}>Dependent 1 Details</td></tr>
                    <tr><td className="pr-field-cell">Name</td><td className="pr-val-cell font-bold">{getVal(form.dependent1Name)}</td></tr>
                    <tr><td className="pr-field-cell">Relation with Primary Applicant</td><td className="pr-val-cell">{getVal(form.dependent1Relation)}</td></tr>
                    <tr><td className="pr-field-cell">Date of Birth (DD/MM/YYYY)</td><td className="pr-val-cell font-bold">{isoToDisplay(form.dependent1Dob)}</td></tr>

                    <tr className="pr-sub-header-row"><td colSpan={2}>Dependent 2 Details</td></tr>
                    <tr><td className="pr-field-cell">Name</td><td className="pr-val-cell font-bold">{getVal(form.dependent2Name)}</td></tr>
                    <tr><td className="pr-field-cell">Relation with Primary Applicant</td><td className="pr-val-cell">{getVal(form.dependent2Relation)}</td></tr>
                    <tr><td className="pr-field-cell">Date of Birth (DD/MM/YYYY)</td><td className="pr-val-cell font-bold">{isoToDisplay(form.dependent2Dob)}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pr-dep-media-grid">
                <div className="pr-dep-media-card">
                  <div className="pr-dep-photo-box">
                    <div className="pr-photo-box-header">ATTESTED</div>
                    <div className="pr-dep-photo-text">Dependent 1 Photo</div>
                    <div className="pr-photo-box-footer">Use Gum. Don't Staple</div>
                  </div>
                  <div className="pr-dep-sig-box">
                    <div className="pr-dep-sig-blank"></div>
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
                    <div className="pr-dep-sig-blank"></div>
                    <div className="pr-dep-sig-label">Dependent 2 Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Self Declaration Section */}
        <div className="pr-declaration-block" style={{ marginTop: "4px" }}>
          <div className="pr-declaration-header">SELF DECLARATION</div>
          {config.declarationText ? (
            <p style={{ fontSize: "8px", margin: "2px 0 4px", lineHeight: 1.3 }}>{config.declarationText}</p>
          ) : (
            <ol className="pr-declaration-list" style={{ fontSize: "8px", margin: "2px 0 4px", paddingLeft: "16px" }}>
              {config.declaration?.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ol>
          )}
          <div className="pr-declaration-footer-row" style={{ marginTop: "2px" }}>
            <div className="pr-decl-date-col" style={{ fontSize: "8.5px" }}>
              Date: <strong>{isoToDisplay(form.applicationDate)}</strong>
            </div>
            <div className="pr-decl-sig-col">
              <div className="pr-decl-sig-box-frame" style={{ height: "26px" }}></div>
              <div className="pr-decl-sig-title">*Signature of Applicant</div>
            </div>
          </div>
        </div>

        {/* Verified & Countersigned */}
        {config.countersigned && (
          <div className="pr-countersigned-box" style={{ marginTop: "4px" }}>
            <div className="pr-countersigned-header">{config.countersigned.title}</div>
            <p className="pr-countersigned-text" style={{ fontSize: "8px", margin: "2px 0 3px" }}>
              {config.countersigned.text}
            </p>
            <div className="pr-countersigned-grid">
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "26px" }}></div>
                <span className="pr-cs-stamp-placeholder">{config.countersigned.roundStampLabel}</span>
                <div className="pr-cs-date-line">Date: ________________________</div>
              </div>
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "26px" }}></div>
                <span className="pr-cs-stamp-placeholder">{config.countersigned.signLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Counter Signed Block for Civil Defence Retired */}
        {config.counterSignedText && (
          <div className="pr-countersigned-box" style={{ marginTop: "4px" }}>
            <div className="pr-countersigned-header">*COUNTER SIGNED</div>
            <p className="pr-countersigned-text" style={{ fontSize: "8px", margin: "2px 0 3px" }}>
              {config.counterSignedText}
            </p>
            <div className="pr-countersigned-grid">
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "26px" }}></div>
                <span className="pr-cs-stamp-placeholder">Designation &amp; Name of Competent Authority / Round Stamp</span>
                <div className="pr-cs-date-line">Date: ________________________</div>
              </div>
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "26px" }}></div>
                <span className="pr-cs-stamp-placeholder">*Signature &amp; Stamp of Office of Competent Authority</span>
                <div className="pr-cs-sub-label">(Not below Director or Equivalent)</div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication by URC (for Civil Defence forms) */}
        {config.urcAuthenticationText && (
          <div className="pr-countersigned-box" style={{ marginTop: "4px" }}>
            <div className="pr-countersigned-header">*AUTHENTICATION BY URC</div>
            <p className="pr-countersigned-text" style={{ fontSize: "8px", margin: "2px 0 3px" }}>
              {config.urcAuthenticationText}
            </p>
            <div className="pr-countersigned-grid">
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "24px" }}></div>
                <span className="pr-cs-stamp-placeholder">Round Stamp of Canteen</span>
                <div className="pr-cs-date-line">Date: ________________________</div>
              </div>
              <div className="pr-cs-col">
                <div className="pr-cs-stamp-box" style={{ height: "24px" }}></div>
                <span className="pr-cs-stamp-placeholder">*Signature &amp; Stamp of OIC URC</span>
              </div>
            </div>
          </div>
        )}

        {/* Important Instructions */}
        <div className="pr-instructions-container" style={{ marginTop: "4px" }}>
          <div className="pr-instructions-header">IMPORTANT INSTRUCTIONS: (USE BLACK INK ONLY)</div>
          <div className="pr-instructions-columns">
            <div className="pr-inst-column">
              {config.instructions?.slice(0, Math.ceil(config.instructions.length / 2)).map((inst, i) => (
                <div key={i} className="pr-inst-item">
                  <span className="pr-inst-num">{i + 1}.</span>
                  <span>{inst}</span>
                </div>
              ))}
            </div>
            <div className="pr-inst-column">
              {config.instructions?.slice(Math.ceil(config.instructions.length / 2)).map((inst, i) => {
                const num = Math.ceil(config.instructions.length / 2) + i + 1;
                return (
                  <div key={num} className="pr-inst-item">
                    <span className="pr-inst-num">{num}.</span>
                    <span>{inst}</span>
                  </div>
                );
              })}
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
