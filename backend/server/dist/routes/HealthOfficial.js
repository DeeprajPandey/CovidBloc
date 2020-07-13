"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const HealthOfficial_1 = __importDefault(require("../models/HealthOfficial"));
const healthRoutes = express_1.Router();
healthRoutes.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const officials = yield HealthOfficial_1.default.findOne({ name: "Mahavir Jhawar" }, "email");
        res.send(officials);
    }
    catch (err) {
        res.status(500).send(err);
    }
}));
/**
 * Will only be used by admin to add new health officers
 */
healthRoutes.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const official = new HealthOfficial_1.default(req.body);
    try {
        yield official.save();
        res.send(official);
    }
    catch (err) {
        res.status(500).send(err);
    }
}));
exports.default = healthRoutes;
//# sourceMappingURL=HealthOfficial.js.map