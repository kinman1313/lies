const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation error:', {
            path: req.path,
            errors: errors.array()
        });

        return res.status(400).json({
            error: 'Validation Error',
            details: errors.array().map(error => ({
                field: error.param,
                message: error.msg
            }))
        });
    }
    next();
};

// Common validation rules
const userValidation = {
    register: [
        {
            field: 'username',
            rules: {
                notEmpty: true,
                isLength: { min: 3, max: 30 },
                matches: /^[a-zA-Z0-9_-]+$/,
                message: 'Username must be between 3 and 30 characters and can only contain letters, numbers, underscores, and hyphens'
            }
        },
        {
            field: 'email',
            rules: {
                notEmpty: true,
                isEmail: true,
                message: 'Please enter a valid email address'
            }
        },
        {
            field: 'password',
            rules: {
                notEmpty: true,
                isLength: { min: 6 },
                matches: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/,
                message: 'Password must be at least 6 characters long and contain uppercase, lowercase, and numbers'
            }
        }
    ],
    login: [
        {
            field: 'email',
            rules: {
                notEmpty: true,
                isEmail: true,
                message: 'Please enter a valid email address'
            }
        },
        {
            field: 'password',
            rules: {
                notEmpty: true,
                message: 'Password is required'
            }
        }
    ]
};

const messageValidation = {
    create: [
        {
            field: 'content',
            rules: {
                notEmpty: true,
                message: 'Message content cannot be empty'
            }
        },
        {
            field: 'type',
            rules: {
                isIn: ['text', 'file', 'voice', 'gif'],
                message: 'Invalid message type'
            }
        },
        {
            field: 'channelId',
            rules: {
                isMongoId: true,
                message: 'Invalid channel ID'
            }
        }
    ],
    update: [
        {
            field: 'content',
            rules: {
                notEmpty: true,
                message: 'Message content cannot be empty'
            }
        }
    ]
};

const channelValidation = {
    create: [
        {
            field: 'name',
            rules: {
                notEmpty: true,
                isLength: { min: 3, max: 50 },
                message: 'Channel name must be between 3 and 50 characters'
            }
        },
        {
            field: 'description',
            rules: {
                optional: true,
                isLength: { max: 500 },
                message: 'Description cannot exceed 500 characters'
            }
        },
        {
            field: 'isPrivate',
            rules: {
                optional: true,
                isBoolean: true,
                message: 'isPrivate must be a boolean'
            }
        }
    ],
    update: [
        {
            field: 'name',
            rules: {
                optional: true,
                isLength: { min: 3, max: 50 },
                message: 'Channel name must be between 3 and 50 characters'
            }
        },
        {
            field: 'description',
            rules: {
                optional: true,
                isLength: { max: 500 },
                message: 'Description cannot exceed 500 characters'
            }
        }
    ]
};

// Helper function to create validation middleware
const createValidationMiddleware = (validations) => {
    return (req, res, next) => {
        const errors = [];

        validations.forEach(validation => {
            const value = req.body[validation.field];
            const rules = validation.rules;

            // Check if field is required
            if (!rules.optional && (!value || (typeof value === 'string' && !value.trim()))) {
                errors.push({
                    field: validation.field,
                    message: `${validation.field} is required`
                });
                return;
            }

            // Skip other validations if field is optional and empty
            if (rules.optional && (!value || (typeof value === 'string' && !value.trim()))) {
                return;
            }

            // Check length constraints
            if (rules.isLength) {
                const length = value.length;
                if (rules.isLength.min && length < rules.isLength.min) {
                    errors.push({
                        field: validation.field,
                        message: `${validation.field} must be at least ${rules.isLength.min} characters`
                    });
                }
                if (rules.isLength.max && length > rules.isLength.max) {
                    errors.push({
                        field: validation.field,
                        message: `${validation.field} cannot exceed ${rules.isLength.max} characters`
                    });
                }
            }

            // Check regex pattern
            if (rules.matches && !rules.matches.test(value)) {
                errors.push({
                    field: validation.field,
                    message: rules.message || `Invalid ${validation.field} format`
                });
            }

            // Check email format
            if (rules.isEmail && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
                errors.push({
                    field: validation.field,
                    message: rules.message || 'Invalid email format'
                });
            }

            // Check boolean type
            if (rules.isBoolean && typeof value !== 'boolean') {
                errors.push({
                    field: validation.field,
                    message: rules.message || `${validation.field} must be a boolean`
                });
            }

            // Check MongoDB ObjectId format
            if (rules.isMongoId && !/^[0-9a-fA-F]{24}$/.test(value)) {
                errors.push({
                    field: validation.field,
                    message: rules.message || `Invalid ${validation.field} format`
                });
            }

            // Check enum values
            if (rules.isIn && !rules.isIn.includes(value)) {
                errors.push({
                    field: validation.field,
                    message: rules.message || `Invalid ${validation.field} value`
                });
            }
        });

        if (errors.length > 0) {
            logger.warn('Validation error:', {
                path: req.path,
                errors
            });

            return res.status(400).json({
                error: 'Validation Error',
                details: errors
            });
        }

        next();
    };
};

module.exports = {
    validate,
    userValidation,
    messageValidation,
    channelValidation,
    createValidationMiddleware
}; 