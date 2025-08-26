const { Router } = require('express')
const userRoute = require('./UserRoute');
const employeeRoute = require('./EmployeeRoute');
const authRoute = require('./AuthRoute');
const accessRoute = require('./AccessRoute');

const api = Router();

api.use('/users', userRoute);

api.use('/employees', employeeRoute);

api.use('/auth', authRoute);

api.use('/access', accessRoute)

export default api;