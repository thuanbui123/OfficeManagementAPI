import type { ReqQ, Res, Next } from '@app-types/common';
import employeeService, { ListEmployeesQuery } from '@services/EmployeeService';

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
}

export default new EmployeeController();
