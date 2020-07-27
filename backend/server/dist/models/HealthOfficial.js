"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mongoose_1 = __importDefault(require("mongoose"));
const HealthSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    hospital: {
        type: String,
        required: true,
        trim: true
    },
    medID: {
        type: String,
        trim: true,
        default: "-1"
    },
    t_status: {
        type: String,
        trim: true,
        uppercase: true,
        default: "UNREGISTERED",
        validate(val) {
            const re_u = new RegExp("UNREGISTERED");
            const re_r = new RegExp("REGISTERED");
            if (!(re_u.test(val) || re_r.test(val))) {
                throw new Error("Invalid status");
            }
            else
                return true;
        }
    },
    t_authstat: {
        type: String,
        trim: true,
        uppercase: true,
        default: "NA",
        validate(val) {
            const re_n = new RegExp("NA");
            const re_i = new RegExp("INITIATED");
            if (!(re_n.test(val) || re_i.test(val))) {
                throw new Error("Invalid auth status");
            }
            else
                return true;
        }
    },
    t_otp: {
        type: String,
        trim: true,
        validate(val) {
            if (!parseInt(val)) {
                throw new Error("Invalid OTP");
            }
            else
                return true;
        }
    },
    t_timestamp: {
        type: String,
        trim: true
    }
});
const HealthOfficialModel = mongoose_1.default.model("HealthOfficialModel", HealthSchema);
module.exports = HealthOfficialModel;
//# sourceMappingURL=HealthOfficial.js.map