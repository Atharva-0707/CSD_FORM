import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import {
  getNextApplicationNumber,
  saveRecord,
  getAllRecords,
  getRecordById,
  DuplicateApplicationNumberError,
} from "../storage.js";

const APPLICATION_TYPES = ["firstTime", "reapplying", "both"];

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.resolve(__dirname, "../uploads");

/* =========================================================
   MULTER STORAGE
   ========================================================= */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsPath);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    cb(null, filename);
  },
});

/* =========================================================
   MULTER CONFIG
   ========================================================= */

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },

  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and PDF files are allowed.")
      );
    }

    cb(null, true);
  },
});

/* =========================================================
   ACCEPT ALL FILE FIELDS FROM FRONTEND
   ========================================================= */

const uploadFields = upload.fields([
  { name: "signaturePhoto", maxCount: 1 },
  { name: "civilDressPhoto", maxCount: 1 },
  { name: "panCardCopy", maxCount: 1 },

  { name: "signature", maxCount: 1 },

  { name: "dependent1Photo", maxCount: 1 },
  { name: "dependent2Photo", maxCount: 1 },

  { name: "dependent1Signature", maxCount: 1 },
  { name: "dependent2Signature", maxCount: 1 },

  { name: "applicantSignature", maxCount: 1 },

  { name: "canteenSignature", maxCount: 1 },
  { name: "oicSignature", maxCount: 1 },
  { name: "countersignedSignature", maxCount: 1 },
]);

/* =========================================================
   FILE INFO HELPER
   ========================================================= */

const fileInfo = (file) => {
  if (!file) {
    return undefined;
  }

  return {
    originalName: file.originalname,
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
  };
};

/* =========================================================
   GENERATE NEXT APPLICATION NUMBER
   ========================================================= */

router.get("/next-number", (_req, res) => {
  try {
    const sequence = getNextApplicationNumber();

    // Format as OE-0000001 (7-digit zero-padded)
    const formatted = `OE-${String(sequence).padStart(7, "0")}`;

    res.json({
      success: true,
      applicationNumber: formatted,
    });
  } catch (error) {
    console.error("Error generating application number:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate application number",
    });
  }
});

/* =========================================================
   CREATE APPLICATION
   ========================================================= */

router.post("/", uploadFields, async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};

    /* -----------------------------------------------------
       Parse array fields safely
       ----------------------------------------------------- */

    let cardApplied = [];

    if (body.cardApplied) {
      try {
        cardApplied = JSON.parse(body.cardApplied);
      } catch {
        cardApplied = [];
      }
    }

    let serviceSubCategory = [];

    if (body.serviceSubCategory) {
      if (Array.isArray(body.serviceSubCategory)) {
        serviceSubCategory = body.serviceSubCategory;
      } else if (typeof body.serviceSubCategory === "string") {
        serviceSubCategory = body.serviceSubCategory
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    /* -----------------------------------------------------
       VALIDATE REQUIRED FIELDS
       ----------------------------------------------------- */

    let applicationNumber = body.applicationNumber;
    if (applicationNumber === undefined || applicationNumber === null || String(applicationNumber).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A valid applicationNumber is required.",
      });
    }
    if (typeof applicationNumber === "number" && !Number.isFinite(applicationNumber)) {
      return res.status(400).json({
        success: false,
        message: "A valid applicationNumber is required.",
      });
    }

    if (!APPLICATION_TYPES.includes(body.applicationType)) {
      return res.status(400).json({
        success: false,
        message: `applicationType must be one of: ${APPLICATION_TYPES.join(", ")}`,
      });
    }

    /* -----------------------------------------------------
       CREATE APPLICATION
       ----------------------------------------------------- */

    const application = saveRecord({
      applicationNumber,

      applicationType: body.applicationType,
      selectedFormType: body.selectedFormType,

      /* ===================================================
         APPLICANT FILES
         =================================================== */

      signaturePhoto: fileInfo(
        files.signaturePhoto?.[0]
      ),

      civilDressPhoto: fileInfo(
        files.civilDressPhoto?.[0]
      ),

      panCardCopy: fileInfo(
        files.panCardCopy?.[0]
      ),

      /* ===================================================
         OTHER SIGNATURE FILES
         =================================================== */

      signature: fileInfo(
        files.signature?.[0]
      ),

      dependent1Photo: fileInfo(
        files.dependent1Photo?.[0]
      ),

      dependent2Photo: fileInfo(
        files.dependent2Photo?.[0]
      ),

      dependent1Signature: fileInfo(
        files.dependent1Signature?.[0]
      ),

      dependent2Signature: fileInfo(
        files.dependent2Signature?.[0]
      ),

      applicantSignature: fileInfo(
        files.applicantSignature?.[0]
      ),

      canteenSignature: fileInfo(
        files.canteenSignature?.[0]
      ),

      oicSignature: fileInfo(
        files.oicSignature?.[0]
      ),

      countersignedSignature: fileInfo(
        files.countersignedSignature?.[0]
      ),

      /* ===================================================
         BASIC DETAILS
         =================================================== */

      statusOption: body.statusOption,
      modDepartment: body.modDepartment,
      modDeptOther: body.modDeptOther,

      cadreOrganisation: body.cadreOrganisation,
      currentDept: body.currentDept,
      parentCadre: body.parentCadre,
      deputationDept: body.deputationDept,
      deputationFrom: body.deputationFrom,
      deputationTo: body.deputationTo,

      payAccountNo: body.payAccountNo,
      designation: body.designation,
      ppoDate: body.ppoDate,
      oldCadetCardId: body.oldCadetCardId,
      oldGroceryCardId: body.oldGroceryCardId,
      oldLiquorCardId: body.oldLiquorCardId,
      likelyCommissioningDate: body.likelyCommissioningDate,
      dateOfEnrolment: body.dateOfEnrolment,
      dateOfRelease: body.dateOfRelease,
      oldPersonalNumber: body.oldPersonalNumber,
      heldCardNo: body.heldCardNo,
      nokName: body.nokName,

      urcNo: body.urcNo,
      urcName: body.urcName,

      service: body.service,

      serviceSubCategory,

      applicantCategory: body.applicantCategory,

      cardCategory: body.cardCategory,

      cardApplied,

      payLevel: body.payLevel,

      oldLiquorGroceryCardId:
        body.oldLiquorGroceryCardId,

      substantiveRank:
        body.substantiveRank,

      personalNumber:
        body.personalNumber,

      fullName:
        body.fullName,

      dateOfBirth:
        body.dateOfBirth,

      panCardNumber:
        body.panCardNumber,

      dateOfJoining:
        body.dateOfJoining,

      dateOfRetirement:
        body.dateOfRetirement,

      ppoNumber:
        body.ppoNumber,

      applicantMobile:
        body.applicantMobile,

      email:
        body.email,

      gender:
        body.gender,

      maritalStatus:
        body.maritalStatus,

      fatherName:
        body.fatherName,

      spouseNokName:
        body.spouseNokName,

      /* ===================================================
         RECEIPT
         =================================================== */

      receipt: {
        amount: body.receiptAmount,

        rank: body.receiptRank,

        personalNumber:
          body.receiptPersonalNumber,

        name:
          body.receiptName,

        forText:
          body.receiptFor,

        cardsAppliedFrom:
          body.receiptCardsAppliedFrom,

        urcCode:
          body.receiptUrcCode,

        canteenName:
          body.receiptCanteenName,

        paymentDoneVia:
          body.receiptPaymentDoneVia,

        cashInstrumentUtrNo:
          body.receiptCashInstrumentUtrNo,

        date:
          body.receiptDate,

        bankName:
          body.bankName,

        branch:
          body.branch,

        receiptDate:
          body.receiptDateBottom,
      },

      /* ===================================================
         ADDRESS
         =================================================== */

      permanentAddress1:
        body.permanentAddress1,

      permanentAddress2:
        body.permanentAddress2,

      city:
        body.city,

      pin:
        body.pin,

      state:
        body.state,

      telNo:
        body.telNo,

      /* ===================================================
         DEPENDENTS
         =================================================== */

      dependent1Name:
        body.dependent1Name,

      dependent1Relation:
        body.dependent1Relation,

      dependent1Dob:
        body.dependent1Dob,

      dependent2Name:
        body.dependent2Name,

      dependent2Relation:
        body.dependent2Relation,

      dependent2Dob:
        body.dependent2Dob,

      /* ===================================================
         DECLARATION
         =================================================== */

      declarationDate:
        body.declarationDate,

      /* ===================================================
         COUNTERSIGNED
         =================================================== */

      countersignedDate:
        body.countersignedDate,
    });

    res.status(201).json({
      success: true,
      message: "Application saved successfully",
      application,
    });
  } catch (error) {
    console.error("Application creation error:", error);

    if (error instanceof DuplicateApplicationNumberError) {
      return res.status(409).json({
        success: false,
        duplicateApplicationNumber: true,
        message:
          "This application number was already used by another submission. Please refresh to get a new number and try again.",
      });
    }

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to save application",
    });
  }
});

/* =========================================================
   GET ALL APPLICATIONS
   ========================================================= */

router.get("/", (_req, res) => {
  try {
    const applications = getAllRecords();

    res.json(applications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================================================
   GET APPLICATION BY ID
   ========================================================= */

router.get("/:id", (req, res) => {
  try {
    const application = getRecordById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json(application);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;