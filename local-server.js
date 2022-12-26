const app = require('./express/server');
const PORT = 5500;
app.listen(PORT, console.log(`App is listening on port:${PORT}`))