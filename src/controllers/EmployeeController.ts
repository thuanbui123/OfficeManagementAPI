import type { ReqQ, Res, Next } from '@app-types/common';
import { publishJSON } from '@events/publisher';
import { EmployeeCreated } from '@events/schemas';
import employeeService, { ListEmployeesQuery } from '@services/EmployeeService';

const TOPIC = 'employee.events';

class EmployeeController {
  async list(req: ReqQ<ListEmployeesQuery>, res: Res, _next: Next) {
    try {
      const result = await employeeService.listEmployees(req.query);
      res.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad Request';
      res.status(400).json({ error: message });
      console.log(e);
    }
  }

  async createEmployee(req: ReqQ<any>, res: Res,  _next: Next) {
    try {
      const { id, empCode, email, fullName, deptId, title, hireDate, salary } = req.body;
      const emp = await employeeService.create({ id, empCode, email, fullName, deptId, title, hireDate, salary });
      console.log("Begin create")
      const evt: EmployeeCreated = {
        eventType: 'EmployeeCreated',
        version: 1,
        at: new Date().toISOString(),
        empCode: emp.empCode,
        email: emp.email,
        fullName: emp.fullName,
        deptId: emp.deptId,
        title: emp.title,
        hireDate: emp.hireDate,
        salary: emp.salary,
      }
      console.log("Publish evt")
      await publishJSON(TOPIC, emp.empCode, evt, { source: "officeManagementAPI" });
      console.log('✅ Published EmployeeCreated');
      res.status(201).json({ id: emp.id });
    } catch (e: any) {
      if (e?.message === "KAFKA_SEND_FAILED") {
        const details = e?.details;
        return res
          .status(502)
          .json({ ok: false, error: "Kafka unavailable", details });
      }
      _next(e);
    }
  }
}

export default new EmployeeController();
