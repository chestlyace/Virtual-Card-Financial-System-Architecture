const createApp = require('./app');
const config = require('./config/config');

const app = createApp();

app.listen(config.port, () => {
  console.log(` Auth service running on port ${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Frontend: http://localhost:${config.port}/`);
  console.log(` API Auth: http://localhost:${config.port}/v1/api/auth`);
  console.log(` API Users: http://localhost:${config.port}/v1/api/users`);
});