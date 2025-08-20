import { Router } from "express";
import ctrl from "../../src/controllers/EmployeeController";

const r = Router();

r.get("/", ctrl.list);

module.exports = r;
