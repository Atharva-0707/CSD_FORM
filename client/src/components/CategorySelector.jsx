import React from "react";
import { FORM_CATEGORIES } from "../formConfigs";

export default function CategorySelector({
  selectedFormType,
  onSelectCategory,
  errorMessage,
  isTouched,
}) {
  const selectedCategoryObj = FORM_CATEGORIES.find(
    (c) => c.id === selectedFormType
  );

  return (
    <div className="wz-section wz-category-section">
      <div className="wz-section-heading">
        <span className="wz-section-heading-icon">📋</span>
        SELECT APPLICATION FORM
      </div>
      <p className="wz-category-subtitle">
        Select the application category that applies to you before continuing.
      </p>

      {/* Accessible Category Grid */}
      <div
        className="wz-category-grid"
        role="radiogroup"
        aria-label="Official Application Form Categories"
      >
        {FORM_CATEGORIES.map((cat) => {
          const isSelected = selectedFormType === cat.id;
          return (
            <div
              key={cat.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              id={`category-card-${cat.id}`}
              className={`wz-category-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectCategory(cat.id);
                }
              }}
            >
              <div className="wz-category-card-header">
                <div className={`wz-category-radio ${isSelected ? "checked" : ""}`}>
                  {isSelected && <div className="wz-category-radio-inner" />}
                </div>
                <div className="wz-category-card-text">
                  <div className="wz-category-card-title">{cat.title}</div>
                  <div className="wz-category-card-desc">{cat.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Error Message */}
      {isTouched && errorMessage && (
        <div className="wz-error-msg wz-category-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Form-Selection Guidance Panel */}
      {selectedCategoryObj && (
        <div className="wz-guidance-panel" aria-live="polite">
          <div className="wz-guidance-header">
            <span className="wz-guidance-tag">Selected Form</span>
            <span className="wz-guidance-title">{selectedCategoryObj.title}</span>
          </div>
          <div className="wz-guidance-body">
            <div className="wz-guidance-instructions-label">
              Before continuing:
            </div>
            <ul className="wz-guidance-list">
              {selectedCategoryObj.guidance.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
              <li>Keep PAN, service, and personal details ready.</li>
              <li>The generated document must be printed and completed physically where required.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
