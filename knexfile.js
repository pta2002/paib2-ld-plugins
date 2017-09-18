// Update with your config settings.
let path = require('path')

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, 'db.sqlite3')
  }
}
