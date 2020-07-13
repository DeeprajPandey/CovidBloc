import mongoose, { mongo } from 'mongoose';

const HealthSchema = new mongoose.Schema({
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
  approveCtr: {
    type: String,
    trim: true,
    default: "0"
  },
  t_status: {
    type: String,
    trim: true,
    uppercase: true,
    default: "UNREGISTERED",
    validate(val: string) {
      const re_u = new RegExp("UNREGISTERED");
      const re_p = new RegExp("PENDING");
      const re_r = new RegExp("REGISTERED");
      if (!(re_u.test(val) || re_p.test(val) || re_r.test(val))) {
        throw new Error("Invalid status");
      } else return true;
    }
  },
  t_otp: {
    type: String,
    trim: true,
    validate(val: string) {
      if (!parseInt(val)) {
        throw new Error("Invalid OTP");
      } else return true;
    }
  },
  t_timestamp: {
    type: String,
    trim: true
  }
});

const HealthOfficialModel = mongoose.model("HealthOfficialModel", HealthSchema);

export = HealthOfficialModel;