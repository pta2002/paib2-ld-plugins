exports.up = function (knex, Promise) {
  return knex.schema.createTable('logs', (t) => {
    t.increments('id').unsigned().primary()
    t.dateTime('posted').notNull()
    t.string('to').notNull()
    t.string('from').notNull()
    t.string('message').nullable()
    t.boolean('action').nullable()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('logs')
}
