import { body } from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const updatePreferencesValidator = [
  body("emailNotifications")
    .isBoolean()
    .withMessage("emailNotifications must be true or false"),
];

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional({ values: "null" })
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/)
    .withMessage("Please provide a valid phone number"),
  body("province").optional().trim(),
  body("district").optional().trim(),
  body("city").optional().trim(),
];

const VALID_CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Water Issue",
  "Street Light",
  "Illegal Construction",
  "Public Space",
  "Other",
];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export const createIssueValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`),
  body("priority")
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage("Invalid priority value"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address is too long"),
  body("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude value"),
  body("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude value"),
];

export const updateIssueValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),
  body("category")
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`),
  body("priority")
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage("Invalid priority value"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address is too long"),
  body("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];
