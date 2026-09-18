"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admission = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdmissionSchema = new mongoose_1.Schema({
    admissionNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    bedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bed',
        required: true,
    },
    admittingDoctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    dischargeDate: {
        type: Date,
    },
    reason: {
        type: String,
        required: true,
    },
    diagnosis: {
        type: String,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DISCHARGED', 'TRANSFERRED'],
        default: 'ACTIVE',
    },
    dischargeSummary: {
        type: String,
    },
    totalBill: {
        type: Number,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id ? ret._id.toString() : ret.id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
AdmissionSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
AdmissionSchema.virtual('bed', {
    ref: 'Bed',
    localField: 'bedId',
    foreignField: '_id',
    justOne: true,
});
AdmissionSchema.virtual('doctor', {
    ref: 'Doctor',
    localField: 'admittingDoctorId',
    foreignField: '_id',
    justOne: true,
});
exports.Admission = mongoose_1.default.model('Admission', AdmissionSchema);
exports.default = exports.Admission;
