import { Types } from "mongoose";

export type EmployeeCreated = {
  eventType: 'EmployeeCreated';
  version: 1;
  at: string;
  empCode: string;
  email: string;
  fullName: string;
  deptId?: Types.ObjectId;
  userId?: Types.ObjectId;
  title?: string;
  hireDate: Date;
  salary: Number;
};

export type EmployeeUpdated = {
  eventType: 'EmployeeUpdated';
  version: 1;
  at: string;
  employeeId: string;
  changes: Partial<{
    email: string;
    fullName: string;
    deptId?: Types.ObjectId;
    userId?: Types.ObjectId;
    title?: string;
    hireDate: Date;
    salary: Number;
  }>;
};

export type EmployeeEvent = EmployeeCreated | EmployeeUpdated;
