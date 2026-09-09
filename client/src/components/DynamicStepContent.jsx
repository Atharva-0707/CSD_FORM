import React from "react";
import { FORM_CONFIGS, MOD_DEPARTMENTS, UNIFORMED_SERVICES_ESM, UNIFORMED_SERVICES_SERVING } from "../formConfigs";

export default function DynamicStepContent({
  step,
  selectedFormType,
  form,
  update,
  toggleArray,
  handleBlur,
  touched,
  errors,
}) {
  const config = FORM_CONFIGS[selectedFormType] || FORM_CONFIGS.esmPensionerWidowNok;

  // --------------------------------------------------------------------------
  // STEP 4: CARD & SERVICE DETAILS
  // --------------------------------------------------------------------------
  if (step === 4) {
    return (
      <>
        {/* Civil Defence Retired: Status Checkboxes */}
        {config.hasStatusCheckboxes && (
          <div className="wz-section">
            <div className="wz-section-heading">
              <span className="wz-section-heading-icon">📌</span>
              Applicant Status
            </div>
            <div className={`wz-field ${touched.statusOption && errors.statusOption ? "has-error" : ""}`}>
              <label className="wz-label">
                Status <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                {config.statusOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`wz-option-pill ${form.statusOption === opt ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="statusOption"
                      checked={form.statusOption === opt}
                      onChange={() => update("statusOption", opt)}
                      onBlur={() => handleBlur("statusOption")}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {touched.statusOption && errors.statusOption && (
                <div className="wz-error-msg">{errors.statusOption}</div>
              )}
            </div>
          </div>
        )}

        {/* URC Details */}
        <div className="wz-section">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">🏢</span>
            URC Details
          </div>
          <div className="wz-field-grid">
            <div className={`wz-field ${touched.urcNo && errors.urcNo ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="urcNo">
                URC No. {config.prefix === "OE" && selectedFormType === "retiringArmedForcesChangeCategory" ? "(Applied From)" : ""}
              </label>
              <input
                id="urcNo"
                type="text"
                className={`wz-input ${touched.urcNo && errors.urcNo ? "input-error" : ""}`}
                placeholder="Enter URC Number (Optional)"
                value={form.urcNo || ""}
                onChange={(e) => update("urcNo", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("urcNo")}
              />
              {touched.urcNo && errors.urcNo && <div className="wz-error-msg">{errors.urcNo}</div>}
            </div>

            <div className={`wz-field ${touched.urcName && errors.urcName ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="urcName">
                URC Name {config.prefix === "OE" && selectedFormType === "retiringArmedForcesChangeCategory" ? "(Applied From)" : ""}
              </label>
              <input
                id="urcName"
                type="text"
                className={`wz-input ${touched.urcName && errors.urcName ? "input-error" : ""}`}
                placeholder="Enter URC Name (Optional)"
                value={form.urcName || ""}
                onChange={(e) => update("urcName", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("urcName")}
              />
              {touched.urcName && errors.urcName && <div className="wz-error-msg">{errors.urcName}</div>}
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="wz-section">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">🎖️</span>
            Service Details
          </div>
          <div className={`wz-field ${touched.service && errors.service ? "has-error" : ""}`}>
            <label className="wz-label">
              Select Service <span className="wz-required">*</span>
            </label>
            <div className="wz-option-group">
              {config.services.map((s) => (
                <label key={s} className={`wz-option-pill ${form.service === s ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="serviceRadio"
                    checked={form.service === s}
                    onChange={() => update("service", s)}
                    onBlur={() => handleBlur("service")}
                  />
                  {s}
                </label>
              ))}
            </div>
            {touched.service && errors.service && <div className="wz-error-msg">{errors.service}</div>}
          </div>

          {/* Conditional: MoD Departments Selection for Civil Defence */}
          {config.hasModOrgSelection && form.service === "MoD" && (
            <div className="wz-field" style={{ marginTop: 14 }}>
              <label className="wz-label">
                If MoD, choose Dept./Org. below <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                {config.modDepts.map((d) => (
                  <label key={d} className={`wz-option-pill ${form.modDepartment === d ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="modDepartment"
                      checked={form.modDepartment === d}
                      onChange={() => update("modDepartment", d)}
                      onBlur={() => handleBlur("modDepartment")}
                    />
                    {d}
                  </label>
                ))}
              </div>
              {form.modDepartment === "Others" && (
                <div style={{ marginTop: 10, maxWidth: 350 }}>
                  <input
                    type="text"
                    className="wz-input"
                    placeholder="Please specify MoD department"
                    value={form.modDeptOther || ""}
                    onChange={(e) => update("modDeptOther", e.target.value.toUpperCase())}
                  />
                </div>
              )}
            </div>
          )}

          {/* Conditional: Uniformed Forces Options for ESM / Serving */}
          {config.otherServiceOptions && form.service && form.service.startsWith("Others") && (
            <div className="wz-field" style={{ marginTop: 14 }}>
              <label className="wz-label">
                Select Force <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                {config.otherServiceOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`wz-option-pill ${form.serviceSubCategory?.includes(opt) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.serviceSubCategory?.includes(opt)}
                      onChange={() => toggleArray("serviceSubCategory", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Applicant Category & Personnel Category */}
        {(config.hasApplicantCategory || config.hasCategoryOfPersonnel || config.hasPayLevel) && (
          <div className="wz-section">
            <div className="wz-section-heading">
              <span className="wz-section-heading-icon">📋</span>
              Category &amp; Entitlement Details
            </div>
            <div className="wz-field-grid">
              {config.hasApplicantCategory && (
                <div className={`wz-field span-2 ${touched.applicantCategory && errors.applicantCategory ? "has-error" : ""}`}>
                  <label className="wz-label">
                    {config.applicantCategoryLabel || "Category of Applicant"} <span className="wz-required">*</span>
                  </label>
                  <div className="wz-option-group">
                    {config.applicantCategories.map((c) => (
                      <label key={c} className={`wz-option-pill ${form.applicantCategory === c ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="applicantCatRadio"
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
              )}

              {config.hasCategoryOfPersonnel && (
                <div className={`wz-field ${touched.cardCategory && errors.cardCategory ? "has-error" : ""}`}>
                  <label className="wz-label">
                    {config.personnelCategoryLabel || "Category"} <span className="wz-required">*</span>
                  </label>
                  <div className="wz-option-group">
                    {config.personnelCategories.map((c) => (
                      <label key={c} className={`wz-option-pill ${form.cardCategory === c ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="personnelCatRadio"
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
              )}

              {config.hasPayLevel && (
                <div className={`wz-field ${touched.payLevel && errors.payLevel ? "has-error" : ""}`}>
                  <label className="wz-label" htmlFor="payLevelInput">
                    {config.payLevelLabel || "Pay Level"} <span className="wz-required">*</span>
                  </label>
                  <select
                    id="payLevelInput"
                    className={`wz-select ${touched.payLevel && errors.payLevel ? "input-error" : ""}`}
                    value={form.payLevel || ""}
                    onChange={(e) => update("payLevel", e.target.value)}
                    onBlur={() => handleBlur("payLevel")}
                  >
                    <option value="">-- Select Pay Level --</option>
                    {config.payLevels.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {touched.payLevel && errors.payLevel && (
                    <div className="wz-error-msg">{errors.payLevel}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cards Applied For (if applicable) */}
        {config.hasCardsApplied && (
          <div className="wz-section">
            <div className="wz-section-heading">
              <span className="wz-section-heading-icon">💳</span>
              Cards Applied For
            </div>
            <div className={`wz-field ${touched.cardApplied && errors.cardApplied ? "has-error" : ""}`}>
              <label className="wz-label">
                Select Card(s) Applied <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                {config.cardOptions.map((opt) => (
                  <label key={opt} className={`wz-option-pill ${form.cardApplied?.includes(opt) ? "selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={form.cardApplied?.includes(opt)}
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

            {/* If Retiring Armed Forces: Presently held Card No */}
            {config.hasPresentlyHeldCardNo && (
              <div className={`wz-field ${touched.heldCardNo && errors.heldCardNo ? "has-error" : ""}`} style={{ marginTop: 14, maxWidth: 420 }}>
                <label className="wz-label" htmlFor="heldCardNo">
                  {config.presentlyHeldCardLabel} <span className="wz-required">*</span>
                </label>
                <input
                  id="heldCardNo"
                  type="text"
                  className={`wz-input ${touched.heldCardNo && errors.heldCardNo ? "input-error" : ""}`}
                  placeholder="Enter presently held card number"
                  value={form.heldCardNo || ""}
                  onChange={(e) => update("heldCardNo", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("heldCardNo")}
                />
                {touched.heldCardNo && errors.heldCardNo && (
                  <div className="wz-error-msg">{errors.heldCardNo}</div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 5: PERSONAL & SERVICE RECORD
  // --------------------------------------------------------------------------
  if (step === 5) {
    const isCadet = selectedFormType === "cadetRecruit";
    const isAgniveer = selectedFormType === "agniveer";
    const isCivilDefence = config.isCivilDefence;
    const isJoiningRequired = ["cadetRecruit", "civilDefenceRetired", "civilDefenceServing", "esmPensionerWidowNok", "retiringArmedForcesChangeCategory", "servingArmedForces"].includes(selectedFormType);
    const isLikelyCommissioningRequired = selectedFormType === "cadetRecruit";
    const isRetirementRequired = ["civilDefenceRetired", "civilDefenceServing", "esmPensionerWidowNok", "retiringArmedForcesChangeCategory", "servingArmedForces"].includes(selectedFormType);

    return (
      <>
        {/* Application Type */}
        {config.hasApplicationType !== false && (
          <div className="wz-section">
            <div className="wz-section-heading">
              <span className="wz-section-heading-icon">📝</span>
              Application Type
            </div>
          <div className="wz-field-grid">
            <div className="wz-field">
              <label className="wz-label">
                Application Type <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                <label className={`wz-option-pill ${form.applicationType === "firstTime" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="appTypeStep5"
                    checked={form.applicationType === "firstTime"}
                    onChange={() => update("applicationType", "firstTime")}
                  />
                  Applying 1st Time
                </label>
                <label className={`wz-option-pill ${form.applicationType === "reapplying" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="appTypeStep5"
                    checked={form.applicationType === "reapplying"}
                    onChange={() => update("applicationType", "reapplying")}
                  />
                  Reapplying
                </label>
              </div>
            </div>

            {/* Reapplying Old Card ID */}
            {selectedFormType === "agniveer" ? (
              form.cardApplied?.includes("Liquor") && form.cardApplied?.includes("Grocery") ? (
                <>
                  <div className={`wz-field ${touched.oldLiquorCardId && errors.oldLiquorCardId ? "has-error" : ""}`}>
                    <label
                      className="wz-label"
                      htmlFor="oldLiquorCardIdInput"
                      style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                    >
                      Old Liquor Card ID{" "}
                      {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                    </label>
                    <input
                      id="oldLiquorCardIdInput"
                      type="text"
                      className={`wz-input ${touched.oldLiquorCardId && errors.oldLiquorCardId ? "input-error" : ""}`}
                      placeholder="Old Liquor Card ID"
                      disabled={form.applicationType === "firstTime"}
                      value={form.oldLiquorCardId || ""}
                      onChange={(e) => update("oldLiquorCardId", e.target.value.toUpperCase())}
                      onBlur={() => handleBlur("oldLiquorCardId")}
                    />
                    {touched.oldLiquorCardId && errors.oldLiquorCardId && (
                      <div className="wz-error-msg">{errors.oldLiquorCardId}</div>
                    )}
                  </div>

                  <div className={`wz-field ${touched.oldGroceryCardId && errors.oldGroceryCardId ? "has-error" : ""}`}>
                    <label
                      className="wz-label"
                      htmlFor="oldGroceryCardIdInput"
                      style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                    >
                      Old Grocery Card ID{" "}
                      {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                    </label>
                    <input
                      id="oldGroceryCardIdInput"
                      type="text"
                      className={`wz-input ${touched.oldGroceryCardId && errors.oldGroceryCardId ? "input-error" : ""}`}
                      placeholder="Old Grocery Card ID"
                      disabled={form.applicationType === "firstTime"}
                      value={form.oldGroceryCardId || ""}
                      onChange={(e) => update("oldGroceryCardId", e.target.value.toUpperCase())}
                      onBlur={() => handleBlur("oldGroceryCardId")}
                    />
                    {touched.oldGroceryCardId && errors.oldGroceryCardId && (
                      <div className="wz-error-msg">{errors.oldGroceryCardId}</div>
                    )}
                  </div>
                </>
              ) : form.cardApplied?.includes("Liquor") ? (
                <div className={`wz-field ${touched.oldLiquorCardId && errors.oldLiquorCardId ? "has-error" : ""}`}>
                  <label
                    className="wz-label"
                    htmlFor="oldLiquorCardIdInput"
                    style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                  >
                    Old Liquor Card ID{" "}
                    {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                  </label>
                  <input
                    id="oldLiquorCardIdInput"
                    type="text"
                    className={`wz-input ${touched.oldLiquorCardId && errors.oldLiquorCardId ? "input-error" : ""}`}
                    placeholder="Old Liquor Card ID"
                    disabled={form.applicationType === "firstTime"}
                    value={form.oldLiquorCardId || ""}
                    onChange={(e) => update("oldLiquorCardId", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("oldLiquorCardId")}
                  />
                  {touched.oldLiquorCardId && errors.oldLiquorCardId && (
                    <div className="wz-error-msg">{errors.oldLiquorCardId}</div>
                  )}
                </div>
              ) : form.cardApplied?.includes("Grocery") ? (
                <div className={`wz-field ${touched.oldGroceryCardId && errors.oldGroceryCardId ? "has-error" : ""}`}>
                  <label
                    className="wz-label"
                    htmlFor="oldGroceryCardIdInput"
                    style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                  >
                    Old Grocery Card ID{" "}
                    {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                  </label>
                  <input
                    id="oldGroceryCardIdInput"
                    type="text"
                    className={`wz-input ${touched.oldGroceryCardId && errors.oldGroceryCardId ? "input-error" : ""}`}
                    placeholder="Old Grocery Card ID"
                    disabled={form.applicationType === "firstTime"}
                    value={form.oldGroceryCardId || ""}
                    onChange={(e) => update("oldGroceryCardId", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("oldGroceryCardId")}
                  />
                  {touched.oldGroceryCardId && errors.oldGroceryCardId && (
                    <div className="wz-error-msg">{errors.oldGroceryCardId}</div>
                  )}
                </div>
              ) : (
                <div className={`wz-field ${touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId ? "has-error" : ""}`}>
                  <label
                    className="wz-label"
                    htmlFor="oldCardIdInput"
                    style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                  >
                    In case of Reapplying enter Old Liquor / Grocery Card ID{" "}
                    {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                  </label>
                  <input
                    id="oldCardIdInput"
                    type="text"
                    className={`wz-input ${touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId ? "input-error" : ""}`}
                    placeholder="Old Card ID"
                    disabled={form.applicationType === "firstTime"}
                    value={form.oldLiquorGroceryCardId || ""}
                    onChange={(e) => update("oldLiquorGroceryCardId", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("oldLiquorGroceryCardId")}
                  />
                  {touched.oldLiquorGroceryCardId && errors.oldLiquorGroceryCardId && (
                    <div className="wz-error-msg">{errors.oldLiquorGroceryCardId}</div>
                  )}
                </div>
              )
            ) : (
              <div className={`wz-field ${touched[config.reapplyingOldCardField] && errors[config.reapplyingOldCardField] ? "has-error" : ""}`}>
                <label
                  className="wz-label"
                  htmlFor="oldCardIdInput"
                  style={{ color: form.applicationType === "firstTime" ? "#9ca3af" : undefined }}
                >
                  {config.reapplyingOldCardLabel}{" "}
                  {form.applicationType === "reapplying" && <span className="wz-required">*</span>}
                </label>
                <input
                  id="oldCardIdInput"
                  type="text"
                  className={`wz-input ${touched[config.reapplyingOldCardField] && errors[config.reapplyingOldCardField] ? "input-error" : ""}`}
                  placeholder="Old Card ID"
                  disabled={form.applicationType === "firstTime"}
                  value={form[config.reapplyingOldCardField] || ""}
                  onChange={(e) => update(config.reapplyingOldCardField, e.target.value.toUpperCase())}
                  onBlur={() => handleBlur(config.reapplyingOldCardField)}
                />
                {touched[config.reapplyingOldCardField] && errors[config.reapplyingOldCardField] && (
                  <div className="wz-error-msg">{errors[config.reapplyingOldCardField]}</div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Service Record / Cadre Details */}
        <div className="wz-section">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">🎖️</span>
            Service &amp; Cadre Particulars
          </div>
          <div className="wz-field-grid">
            {/* Rank / Designation */}
            {config.rankInputType === "fixed" ? (
              <div className="wz-field">
                <label className="wz-label">Rank</label>
                <input
                  type="text"
                  className="wz-input font-bold"
                  value="AGNIVEER"
                  readOnly
                  disabled
                  style={{ background: "#f3f4f6", color: "#111827", fontWeight: 700 }}
                />
              </div>
            ) : config.rankInputType === "select" ? (
              <div className={`wz-field ${touched.substantiveRank && errors.substantiveRank ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="rankSelect">
                  Rank <span className="wz-required">*</span>
                </label>
                <select
                  id="rankSelect"
                  className={`wz-select ${touched.substantiveRank && errors.substantiveRank ? "input-error" : ""}`}
                  value={form.substantiveRank || ""}
                  onChange={(e) => update("substantiveRank", e.target.value)}
                  onBlur={() => handleBlur("substantiveRank")}
                >
                  <option value="">-- Select Rank --</option>
                  {config.ranks.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {touched.substantiveRank && errors.substantiveRank && (
                  <div className="wz-error-msg">{errors.substantiveRank}</div>
                )}
              </div>
            ) : config.rankInputType === "designation" ? (
              <div className={`wz-field ${touched.designation && errors.designation ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="designationInput">
                  Designation <span className="wz-required">*</span>
                </label>
                <input
                  id="designationInput"
                  type="text"
                  className={`wz-input ${touched.designation && errors.designation ? "input-error" : ""}`}
                  placeholder="e.g. Senior Technical Assistant / Assistant Director"
                  value={form.designation || ""}
                  onChange={(e) => update("designation", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("designation")}
                />
                {touched.designation && errors.designation && (
                  <div className="wz-error-msg">{errors.designation}</div>
                )}
              </div>
            ) : (
              <div className={`wz-field ${touched.substantiveRank && errors.substantiveRank ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="substantiveRank">
                  {config.rankLabel || "Rank"} <span className="wz-required">*</span>
                </label>
                <input
                  id="substantiveRank"
                  type="text"
                  className={`wz-input ${touched.substantiveRank && errors.substantiveRank ? "input-error" : ""}`}
                  placeholder="e.g. Havildar / Subedar / Major"
                  value={form.substantiveRank || ""}
                  onChange={(e) => update("substantiveRank", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("substantiveRank")}
                />
                {touched.substantiveRank && errors.substantiveRank && (
                  <div className="wz-error-msg">{errors.substantiveRank}</div>
                )}
              </div>
            )}

            {/* Personal Number (Non Civil Defence) */}
            {!isCivilDefence && (
              <div className={`wz-field ${touched.personalNumber && errors.personalNumber ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="personalNumber">
                  Personal Number <span className="wz-required">*</span>
                </label>
                <input
                  id="personalNumber"
                  type="text"
                  className={`wz-input ${touched.personalNumber && errors.personalNumber ? "input-error" : ""}`}
                  placeholder="Enter Personal Number"
                  value={form.personalNumber || ""}
                  onChange={(e) => update("personalNumber", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("personalNumber")}
                />
                {touched.personalNumber && errors.personalNumber && (
                  <div className="wz-error-msg">{errors.personalNumber}</div>
                )}
              </div>
            )}

            {/* Old Personal No (Serving Armed Forces rank promotion) */}
            {config.hasOldPersonalNumber && (
              <div className="wz-field">
                <label className="wz-label" htmlFor="oldPersonalNumber">
                  {config.oldPersonalNumberLabel}
                </label>
                <input
                  id="oldPersonalNumber"
                  type="text"
                  className="wz-input"
                  placeholder="Old Personal Number"
                  value={form.oldPersonalNumber || ""}
                  onChange={(e) => update("oldPersonalNumber", e.target.value.toUpperCase())}
                />
              </div>
            )}

            {/* Civil Defence Specific Fields */}
            {isCivilDefence && (
              <>
                <div className={`wz-field ${touched.cadreOrganisation && errors.cadreOrganisation ? "has-error" : ""}`}>
                  <label className="wz-label" htmlFor="cadreOrg">
                    Posted with Current Cadre/Organisation <span className="wz-required">*</span>
                  </label>
                  <input
                    id="cadreOrg"
                    type="text"
                    className={`wz-input ${touched.cadreOrganisation && errors.cadreOrganisation ? "input-error" : ""}`}
                    placeholder="e.g. DRDO / DGQA / E-in-C"
                    value={form.cadreOrganisation || ""}
                    onChange={(e) => update("cadreOrganisation", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("cadreOrganisation")}
                  />
                  {touched.cadreOrganisation && errors.cadreOrganisation && (
                    <div className="wz-error-msg">{errors.cadreOrganisation}</div>
                  )}
                </div>

                <div className={`wz-field ${touched.currentDept && errors.currentDept ? "has-error" : ""}`}>
                  <label className="wz-label" htmlFor="curDept">
                    Current Dept. <span className="wz-required">*</span>
                  </label>
                  <input
                    id="curDept"
                    type="text"
                    className={`wz-input ${touched.currentDept && errors.currentDept ? "input-error" : ""}`}
                    placeholder="Current Department"
                    value={form.currentDept || ""}
                    onChange={(e) => update("currentDept", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("currentDept")}
                  />
                  {touched.currentDept && errors.currentDept && (
                    <div className="wz-error-msg">{errors.currentDept}</div>
                  )}
                </div>

                <div className={`wz-field ${touched.payAccountNo && errors.payAccountNo ? "has-error" : ""}`}>
                  <label className="wz-label" htmlFor="payAcc">
                    Pay Account No as per Salary Slip <span className="wz-required">*</span>
                  </label>
                  <input
                    id="payAcc"
                    type="text"
                    className={`wz-input ${touched.payAccountNo && errors.payAccountNo ? "input-error" : ""}`}
                    placeholder="Pay Account Number"
                    value={form.payAccountNo || ""}
                    onChange={(e) => update("payAccountNo", e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("payAccountNo")}
                  />
                  {touched.payAccountNo && errors.payAccountNo && (
                    <div className="wz-error-msg">{errors.payAccountNo}</div>
                  )}
                </div>

                {/* Deputation Section for Civil Defence */}
                <div className="wz-field span-2" style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#1e293b" }}>
                    If on deputation to Defence Organisation (Optional):
                  </div>
                  <div className="wz-field-grid">
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="parentCadre">Name of Parent Cadre/Organisation</label>
                      <input
                        id="parentCadre"
                        type="text"
                        className="wz-input"
                        placeholder="Parent Cadre / Organisation"
                        value={form.parentCadre || ""}
                        onChange={(e) => update("parentCadre", e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="depDept">Parent Dept</label>
                      <input
                        id="depDept"
                        type="text"
                        className="wz-input"
                        placeholder="Department"
                        value={form.deputationDept || ""}
                        onChange={(e) => update("deputationDept", e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="depFrom">Duration of Deputation From</label>
                      <input
                        id="depFrom"
                        type="date"
                        className="wz-input"
                        value={form.deputationFrom || ""}
                        onChange={(e) => update("deputationFrom", e.target.value)}
                      />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label" htmlFor="depTo">Duration of Deputation To</label>
                      <input
                        id="depTo"
                        type="date"
                        className="wz-input"
                        value={form.deputationTo || ""}
                        onChange={(e) => update("deputationTo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Civil Defence Retired: PPO No. & Date */}
                {config.hasPpoNumberAndDate && (
                  <>
                    <div className={`wz-field ${touched.ppoNumber && errors.ppoNumber ? "has-error" : ""}`}>
                      <label className="wz-label" htmlFor="ppoNumCivil">
                        PPO No. (Mandatory for Retd. Pers./Widows/NOK){form.statusOption !== "Retiring" ? <span className="wz-required">*</span> : <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: 4 }}>(Optional for Retiring)</span>}
                      </label>
                      <input
                        id="ppoNumCivil"
                        type="text"
                        className={`wz-input ${touched.ppoNumber && errors.ppoNumber ? "input-error" : ""}`}
                        placeholder={form.statusOption === "Retiring" ? "PPO Number (If allotted)" : "PPO Number"}
                        value={form.ppoNumber || ""}
                        onChange={(e) => update("ppoNumber", e.target.value.toUpperCase())}
                        onBlur={() => handleBlur("ppoNumber")}
                      />
                      {touched.ppoNumber && errors.ppoNumber && (
                        <div className="wz-error-msg">{errors.ppoNumber}</div>
                      )}
                    </div>
                    <div className={`wz-field ${touched.ppoDate && errors.ppoDate ? "has-error" : ""}`}>
                      <label className="wz-label" htmlFor="ppoDateCivil">
                        PPO Date {form.statusOption !== "Retiring" ? <span className="wz-required">*</span> : <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: 4 }}>(Optional for Retiring)</span>}
                      </label>
                      <input
                        id="ppoDateCivil"
                        type="date"
                        className={`wz-input ${touched.ppoDate && errors.ppoDate ? "input-error" : ""}`}
                        value={form.ppoDate || ""}
                        onChange={(e) => update("ppoDate", e.target.value)}
                        onBlur={() => handleBlur("ppoDate")}
                      />
                      {touched.ppoDate && errors.ppoDate && (
                        <div className="wz-error-msg">{errors.ppoDate}</div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* PPO Number (for ESM) */}
            {config.hasPpoNumber && (
              <div className="wz-field">
                <label className="wz-label" htmlFor="ppoNumber">
                  {config.ppoLabel || "Pension Pay Account No (PPO No.) If alloted"}
                </label>
                <input
                  id="ppoNumber"
                  type="text"
                  className="wz-input"
                  placeholder="Pension Pay Account No."
                  value={form.ppoNumber || ""}
                  onChange={(e) => update("ppoNumber", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Personal Details */}
        <div className="wz-section">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">👤</span>
            Personal Particulars
          </div>
          <div className="wz-field-grid">
            <div className={`wz-field span-2 ${touched.fullName && errors.fullName ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="fullName">
                Full Name (Please leave blank box for space) <span className="wz-required">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={`wz-input ${touched.fullName && errors.fullName ? "input-error" : ""}`}
                placeholder="Full Name as per official records"
                value={form.fullName || ""}
                onChange={(e) => update("fullName", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("fullName")}
              />
              {touched.fullName && errors.fullName && <div className="wz-error-msg">{errors.fullName}</div>}
            </div>

            <div className={`wz-field ${touched.dateOfBirth && errors.dateOfBirth ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="dateOfBirth">
                Date of Birth (DD/MM/YYYY) <span className="wz-required">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                className={`wz-input ${touched.dateOfBirth && errors.dateOfBirth ? "input-error" : ""}`}
                value={form.dateOfBirth || ""}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                onBlur={() => handleBlur("dateOfBirth")}
              />
              {touched.dateOfBirth && errors.dateOfBirth && <div className="wz-error-msg">{errors.dateOfBirth}</div>}
            </div>

            <div className={`wz-field ${touched.panCardNumber && errors.panCardNumber ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="panCardNumber">
                PAN Card (Attach Copy) <span className="wz-required">*</span>
              </label>
              <input
                id="panCardNumber"
                type="text"
                className={`wz-input ${touched.panCardNumber && errors.panCardNumber ? "input-error" : ""}`}
                placeholder="e.g. ABCDE1234F"
                value={form.panCardNumber || ""}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
                  update("panCardNumber", val);
                }}
                onBlur={() => handleBlur("panCardNumber")}
              />
              {touched.panCardNumber && errors.panCardNumber ? (
                <div className="wz-error-msg">{errors.panCardNumber}</div>
              ) : (
                <small className="wz-helper-text">Format: 5 letters + 4 digits + 1 letter</small>
              )}
            </div>

            {/* Service Dates based on Config */}
            {config.serviceDateLabels?.dateOfJoining && (
              <div className={`wz-field ${touched.dateOfJoining && errors.dateOfJoining ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="dateOfJoining">
                  {config.serviceDateLabels.dateOfJoining} {isJoiningRequired && <span className="wz-required">*</span>}
                </label>
                <input
                  id="dateOfJoining"
                  type="date"
                  className={`wz-input ${touched.dateOfJoining && errors.dateOfJoining ? "input-error" : ""}`}
                  value={form.dateOfJoining || ""}
                  onChange={(e) => update("dateOfJoining", e.target.value)}
                  onBlur={() => handleBlur("dateOfJoining")}
                />
                {touched.dateOfJoining && errors.dateOfJoining && (
                  <div className="wz-error-msg">{errors.dateOfJoining}</div>
                )}
              </div>
            )}

            {config.serviceDateLabels?.likelyCommissioningDate && (
              <div className={`wz-field ${touched.likelyCommissioningDate && errors.likelyCommissioningDate ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="likelyCommissioningDate">
                  {config.serviceDateLabels.likelyCommissioningDate} {isLikelyCommissioningRequired && <span className="wz-required">*</span>}
                </label>
                <input
                  id="likelyCommissioningDate"
                  type="date"
                  className={`wz-input ${touched.likelyCommissioningDate && errors.likelyCommissioningDate ? "input-error" : ""}`}
                  value={form.likelyCommissioningDate || ""}
                  onChange={(e) => update("likelyCommissioningDate", e.target.value)}
                  onBlur={() => handleBlur("likelyCommissioningDate")}
                />
                {touched.likelyCommissioningDate && errors.likelyCommissioningDate && (
                  <div className="wz-error-msg">{errors.likelyCommissioningDate}</div>
                )}
              </div>
            )}

            {config.serviceDateLabels?.dateOfEnrolment && (
              <div className={`wz-field ${touched.dateOfEnrolment && errors.dateOfEnrolment ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="dateOfEnrolment">
                  {config.serviceDateLabels.dateOfEnrolment} <span className="wz-required">*</span>
                </label>
                <input
                  id="dateOfEnrolment"
                  type="date"
                  className={`wz-input ${touched.dateOfEnrolment && errors.dateOfEnrolment ? "input-error" : ""}`}
                  value={form.dateOfEnrolment || ""}
                  onChange={(e) => {
                    update("dateOfEnrolment", e.target.value);
                    // Automatically calculate Date of Release (4 years from DOE) if empty
                    if (e.target.value && !form.dateOfRelease) {
                      const parts = e.target.value.split("-");
                      if (parts.length === 3) {
                        const y = parseInt(parts[0], 10) + 4;
                        const relIso = `${y}-${parts[1]}-${parts[2]}`;
                        update("dateOfRelease", relIso);
                      }
                    }
                  }}
                  onBlur={() => handleBlur("dateOfEnrolment")}
                />
                {touched.dateOfEnrolment && errors.dateOfEnrolment && (
                  <div className="wz-error-msg">{errors.dateOfEnrolment}</div>
                )}
              </div>
            )}

            {config.serviceDateLabels?.dateOfRelease && (
              <div className={`wz-field ${touched.dateOfRelease && errors.dateOfRelease ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="dateOfRelease">
                  {config.serviceDateLabels.dateOfRelease} <span className="wz-required">*</span>
                </label>
                <input
                  id="dateOfRelease"
                  type="date"
                  className={`wz-input ${touched.dateOfRelease && errors.dateOfRelease ? "input-error" : ""}`}
                  value={form.dateOfRelease || ""}
                  onChange={(e) => update("dateOfRelease", e.target.value)}
                  onBlur={() => handleBlur("dateOfRelease")}
                />
                {touched.dateOfRelease && errors.dateOfRelease && (
                  <div className="wz-error-msg">{errors.dateOfRelease}</div>
                )}
              </div>
            )}

            {config.serviceDateLabels?.dateOfRetirement && (
              <div className={`wz-field ${touched.dateOfRetirement && errors.dateOfRetirement ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="dateOfRetirement">
                  {config.serviceDateLabels.dateOfRetirement} {isRetirementRequired && <span className="wz-required">*</span>}
                </label>
                <input
                  id="dateOfRetirement"
                  type="date"
                  className={`wz-input ${touched.dateOfRetirement && errors.dateOfRetirement ? "input-error" : ""}`}
                  value={form.dateOfRetirement || ""}
                  onChange={(e) => update("dateOfRetirement", e.target.value)}
                  onBlur={() => handleBlur("dateOfRetirement")}
                />
                {touched.dateOfRetirement && errors.dateOfRetirement && (
                  <div className="wz-error-msg">{errors.dateOfRetirement}</div>
                )}
              </div>
            )}

            {/* Gender */}
            <div className={`wz-field ${touched.gender && errors.gender ? "has-error" : ""}`}>
              <label className="wz-label">
                Gender <span className="wz-required">*</span>
              </label>
              <div className="wz-option-group">
                {["Male", "Female"].map((g) => (
                  <label key={g} className={`wz-option-pill ${form.gender === g ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="genderStep5"
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

            {/* Marital Status */}
            <div className="wz-field">
              <label className="wz-label">Marital Status</label>
              <div className="wz-option-group">
                {["Married", "Single", "Widow / Widower"].map((ms) => (
                  <label key={ms} className={`wz-option-pill ${form.maritalStatus === ms ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="maritalStep5"
                      checked={form.maritalStatus === ms}
                      onChange={() => update("maritalStatus", ms)}
                    />
                    {ms}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Family Details */}
        <div className="wz-section">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">📞</span>
            Contact &amp; Family Particulars
          </div>
          <div className="wz-field-grid">
            <div className={`wz-field ${touched.applicantMobile && errors.applicantMobile ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="applicantMobile">
                Applicant Mobile No. <span className="wz-required">*</span>
              </label>
              <input
                id="applicantMobile"
                type="text"
                className={`wz-input ${touched.applicantMobile && errors.applicantMobile ? "input-error" : ""}`}
                placeholder="10-digit mobile number"
                value={form.applicantMobile || ""}
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
              <label className="wz-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`wz-input ${touched.email && errors.email ? "input-error" : ""}`}
                placeholder="user@example.com"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => handleBlur("email")}
              />
              {touched.email && errors.email && <div className="wz-error-msg">{errors.email}</div>}
            </div>

            <div className={`wz-field ${touched.fatherName && errors.fatherName ? "has-error" : ""}`}>
              <label className="wz-label" htmlFor="fatherName">
                Applicant's Father's Name <span className="wz-required">*</span>
              </label>
              <input
                id="fatherName"
                type="text"
                className={`wz-input ${touched.fatherName && errors.fatherName ? "input-error" : ""}`}
                placeholder="Father's full name"
                value={form.fatherName || ""}
                onChange={(e) => update("fatherName", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("fatherName")}
              />
              {touched.fatherName && errors.fatherName && (
                <div className="wz-error-msg">{errors.fatherName}</div>
              )}
            </div>

            {config.hasNokName ? (
              <div className={`wz-field ${touched.nokName && errors.nokName ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="nokName">
                  Name of NOK {selectedFormType !== "agniveer" && <span className="wz-required">*</span>}
                </label>
                <input
                  id="nokName"
                  type="text"
                  className={`wz-input ${touched.nokName && errors.nokName ? "input-error" : ""}`}
                  placeholder={selectedFormType === "agniveer" ? "Next of Kin Name (Optional)" : "Next of Kin Name"}
                  value={form.nokName || ""}
                  onChange={(e) => update("nokName", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("nokName")}
                />
                {touched.nokName && errors.nokName && (
                  <div className="wz-error-msg">{errors.nokName}</div>
                )}
              </div>
            ) : (
              <div className={`wz-field ${touched.spouseNokName && errors.spouseNokName ? "has-error" : ""}`}>
                <label className="wz-label" htmlFor="spouseNokName">
                  Name of Spouse / NOK <span className="wz-required">*</span>
                </label>
                <input
                  id="spouseNokName"
                  type="text"
                  className={`wz-input ${touched.spouseNokName && errors.spouseNokName ? "input-error" : ""}`}
                  placeholder="Spouse or Next of Kin name"
                  value={form.spouseNokName || ""}
                  onChange={(e) => update("spouseNokName", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("spouseNokName")}
                />
                {touched.spouseNokName && errors.spouseNokName && (
                  <div className="wz-error-msg">{errors.spouseNokName}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 6: ADDRESS DETAILS (Only if supported by category)
  // --------------------------------------------------------------------------
  if (step === 6) {
    const isContactAddress = selectedFormType.startsWith("civilDefence");
    return (
      <div className="wz-section">
        <div className="wz-section-heading">
          <span className="wz-section-heading-icon">🏠</span>
          {isContactAddress ? "Contact Address" : "Permanent Address"} Details
        </div>
        <div className="wz-field-grid cols-1">
          <div className={`wz-field ${touched.permanentAddress1 && errors.permanentAddress1 ? "has-error" : ""}`}>
            <label className="wz-label" htmlFor="addr1">
              {isContactAddress ? "Address" : "Permanent Address — Line 1"} <span className="wz-required">*</span>
            </label>
            <input
              id="addr1"
              type="text"
              className={`wz-input ${touched.permanentAddress1 && errors.permanentAddress1 ? "input-error" : ""}`}
              placeholder="House No., Street, Colony, Landmark…"
              value={form.permanentAddress1 || ""}
              onChange={(e) => update("permanentAddress1", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("permanentAddress1")}
            />
            {touched.permanentAddress1 && errors.permanentAddress1 && (
              <div className="wz-error-msg">{errors.permanentAddress1}</div>
            )}
          </div>

          <div className="wz-field">
            <label className="wz-label" htmlFor="addr2">
              Address — Line 2 (Optional)
            </label>
            <input
              id="addr2"
              type="text"
              className="wz-input"
              placeholder="Area, Post Office, Tehsil…"
              value={form.permanentAddress2 || ""}
              onChange={(e) => update("permanentAddress2", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="wz-field-grid cols-3" style={{ marginTop: 16 }}>
          <div className={`wz-field ${touched.city && errors.city ? "has-error" : ""}`}>
            <label className="wz-label" htmlFor="city">
              City <span className="wz-required">*</span>
            </label>
            <input
              id="city"
              type="text"
              className={`wz-input ${touched.city && errors.city ? "input-error" : ""}`}
              placeholder="City"
              value={form.city || ""}
              onChange={(e) => update("city", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("city")}
            />
            {touched.city && errors.city && <div className="wz-error-msg">{errors.city}</div>}
          </div>

          <div className={`wz-field ${touched.state && errors.state ? "has-error" : ""}`}>
            <label className="wz-label" htmlFor="state">
              State <span className="wz-required">*</span>
            </label>
            <input
              id="state"
              type="text"
              className={`wz-input ${touched.state && errors.state ? "input-error" : ""}`}
              placeholder="State"
              value={form.state || ""}
              onChange={(e) => update("state", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("state")}
            />
            {touched.state && errors.state && <div className="wz-error-msg">{errors.state}</div>}
          </div>

          <div className={`wz-field ${touched.pin && errors.pin ? "has-error" : ""}`}>
            <label className="wz-label" htmlFor="pin">
              PIN Code <span className="wz-required">*</span>
            </label>
            <input
              id="pin"
              type="text"
              className={`wz-input ${touched.pin && errors.pin ? "input-error" : ""}`}
              placeholder="6-digit PIN"
              value={form.pin || ""}
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

        <div className="wz-field-grid" style={{ marginTop: 16 }}>
          <div className={`wz-field ${touched.telNo && errors.telNo ? "has-error" : ""}`}>
            <label className="wz-label" htmlFor="telNo">
              Telephone / Tel No. (Optional)
            </label>
            <input
              id="telNo"
              type="text"
              className={`wz-input ${touched.telNo && errors.telNo ? "input-error" : ""}`}
              placeholder="Landline or contact phone number"
              value={form.telNo || ""}
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
    );
  }

  // --------------------------------------------------------------------------
  // STEP 7: DEPENDENTS DETAILS (Only if supported by category)
  // --------------------------------------------------------------------------
  if (step === 7) {
    const relations = config.dependentRelations || ["Spouse", "Daughter", "Son", "Mother", "Father"];
    const isDep1Required = form.cardApplied?.includes("Dependent1");
    const isDep2Required = form.cardApplied?.includes("Dependent2");

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Dependent 1 */}
        <div className="wz-dep-card">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">👤</span>
            Dependent 1 Details {isDep1Required && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: "normal", marginLeft: 6 }}>(Required as card selected)</span>}
          </div>
          <div className={`wz-field ${touched.dependent1Name && errors.dependent1Name ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label" htmlFor="dep1name">
              Full Name {isDep1Required && <span className="wz-required">*</span>}
            </label>
            <input
              id="dep1name"
              type="text"
              className={`wz-input ${touched.dependent1Name && errors.dependent1Name ? "input-error" : ""}`}
              placeholder="Dependent 1 full name"
              value={form.dependent1Name || ""}
              onChange={(e) => update("dependent1Name", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("dependent1Name")}
            />
            {touched.dependent1Name && errors.dependent1Name && (
              <div className="wz-error-msg">{errors.dependent1Name}</div>
            )}
          </div>

          <div className={`wz-field ${touched.dependent1Relation && errors.dependent1Relation ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label">
              Relation with Primary Applicant {isDep1Required && <span className="wz-required">*</span>}
            </label>
            <div className="wz-option-group">
              {relations.map((r) => (
                <label key={r} className={`wz-option-pill ${form.dependent1Relation === r ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="dep1relationRadio"
                    checked={form.dependent1Relation === r}
                    onChange={() => update("dependent1Relation", r)}
                    onBlur={() => handleBlur("dependent1Relation")}
                  />
                  {r}
                </label>
              ))}
            </div>
            {touched.dependent1Relation && errors.dependent1Relation && (
              <div className="wz-error-msg">{errors.dependent1Relation}</div>
            )}
          </div>

          <div className={`wz-field ${touched.dependent1Dob && errors.dependent1Dob ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label" htmlFor="dep1dob">
              Date of Birth (DD/MM/YYYY) {isDep1Required && <span className="wz-required">*</span>}
            </label>
            <input
              id="dep1dob"
              type="date"
              className={`wz-input ${touched.dependent1Dob && errors.dependent1Dob ? "input-error" : ""}`}
              value={form.dependent1Dob || ""}
              onChange={(e) => update("dependent1Dob", e.target.value)}
              onBlur={() => handleBlur("dependent1Dob")}
            />
            {touched.dependent1Dob && errors.dependent1Dob && (
              <div className="wz-error-msg">{errors.dependent1Dob}</div>
            )}
          </div>

          {errors.dependent1 && (
            <div className="wz-error-msg" style={{ marginTop: 8 }}>{errors.dependent1}</div>
          )}
        </div>

        {/* Dependent 2 */}
        <div className="wz-dep-card">
          <div className="wz-section-heading">
            <span className="wz-section-heading-icon">👤</span>
            Dependent 2 Details {isDep2Required && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: "normal", marginLeft: 6 }}>(Required as card selected)</span>}
          </div>
          <div className={`wz-field ${touched.dependent2Name && errors.dependent2Name ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label" htmlFor="dep2name">
              Full Name {isDep2Required && <span className="wz-required">*</span>}
            </label>
            <input
              id="dep2name"
              type="text"
              className={`wz-input ${touched.dependent2Name && errors.dependent2Name ? "input-error" : ""}`}
              placeholder="Dependent 2 full name"
              value={form.dependent2Name || ""}
              onChange={(e) => update("dependent2Name", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("dependent2Name")}
            />
            {touched.dependent2Name && errors.dependent2Name && (
              <div className="wz-error-msg">{errors.dependent2Name}</div>
            )}
          </div>

          <div className={`wz-field ${touched.dependent2Relation && errors.dependent2Relation ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label">
              Relation with Primary Applicant {isDep2Required && <span className="wz-required">*</span>}
            </label>
            <div className="wz-option-group">
              {relations.map((r) => (
                <label key={r} className={`wz-option-pill ${form.dependent2Relation === r ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="dep2relationRadio"
                    checked={form.dependent2Relation === r}
                    onChange={() => update("dependent2Relation", r)}
                    onBlur={() => handleBlur("dependent2Relation")}
                  />
                  {r}
                </label>
              ))}
            </div>
            {touched.dependent2Relation && errors.dependent2Relation && (
              <div className="wz-error-msg">{errors.dependent2Relation}</div>
            )}
          </div>

          <div className={`wz-field ${touched.dependent2Dob && errors.dependent2Dob ? "has-error" : ""}`} style={{ marginBottom: 14 }}>
            <label className="wz-label" htmlFor="dep2dob">
              Date of Birth (DD/MM/YYYY) {isDep2Required && <span className="wz-required">*</span>}
            </label>
            <input
              id="dep2dob"
              type="date"
              className={`wz-input ${touched.dependent2Dob && errors.dependent2Dob ? "input-error" : ""}`}
              value={form.dependent2Dob || ""}
              onChange={(e) => update("dependent2Dob", e.target.value)}
              onBlur={() => handleBlur("dependent2Dob")}
            />
            {touched.dependent2Dob && errors.dependent2Dob && (
              <div className="wz-error-msg">{errors.dependent2Dob}</div>
            )}
          </div>

          {errors.dependent2 && (
            <div className="wz-error-msg" style={{ marginTop: 8 }}>{errors.dependent2}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
