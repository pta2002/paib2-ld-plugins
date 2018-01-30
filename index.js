let fs = require('fs')
let path = require('path')
let knex = require('knex')(require('./knexfile'))
let moment = require('moment')

let rp = require('request-promise')

module.exports = {
  ideagen: {
    name: 'ideagen',
    description: 'Generate game ideas and names',
    init (api) {
      this.ideasections = require('./ideasections')
      this.ikeasections = require('./ikeasections')
      this.names = fs.readFileSync(path.join(__dirname, 'video_game_names.txt'), 'utf8')

      api.addCommand('idea', (from, to, msg) => {
        let part1 = this.ideasections.list1[Math.floor(Math.random() * this.ideasections.list1.length)]
        let part2 = this.ideasections.list2[Math.floor(Math.random() * this.ideasections.list2.length)]
        let part3 = this.ideasections.list3[Math.floor(Math.random() * this.ideasections.list3.length)]

        let n = ''
        if (['a', 'e', 'i', 'o', 'u'].indexOf(part1[0].toLowerCase()) >= 0) { n = 'n' }

        api.say(to, `Make a${n} ${part1} ${part2} ${part3}!`)
      })

      api.addCommand('ikea', (from, to, msg) => {
        let part1 = this.ikeasections.list1[Math.floor(Math.random() * this.ikeasections.list1.length)]
        let part2 = this.ikeasections.list2[Math.floor(Math.random() * this.ikeasections.list2.length)]
        let part3 = this.ikeasections.list3[Math.floor(Math.random() * this.ikeasections.list3.length)]

        api.say(to, `Make ${part1} ${part2} ${part3}!`)
      })


      api.addCommand('name', (from, to, msg) => {
                // List from https://videogamena.me/video_game_names.txt
        let ideas = []
        let similar = {}
        this.names.split('----\n').forEach(ideaParts => {
          let tmp = []
          ideaParts.split('\n').forEach(ideaPart => {
            let [idea, similarParts] = ideaPart.split('^')
            if (similarParts) { similar[idea] = similarParts.split('|') }
            tmp.push(idea)
          })

          ideas.push(tmp)
        })

        let name = []

        ideas.forEach(ideaParts => {
          let part = ideaParts[Math.floor(Math.random() * ideaParts.length)]
          if (typeof similar[part] !== 'undefined') {
            ideas.forEach(ideaParts => {
              similar[part].forEach(similar => {
                if (ideaParts.indexOf(similar) >= 0) {
                  ideaParts.splice(ideaParts.indexOf(similar))
                }
              })
            })
          }
          name.push(part)
        })

        api.say(to, name.join(' '))
      })
    }
  },
  ld: {
    name: 'ld',
    description: 'Find games for a user',
    init (api) {
      api.addCommand('find', (from, to, msg) => {
        let user = msg.split(' ')[0]
        if (user === '') { user = from }

        rp(`https://api.ldjam.com/vx/node/walk/1/users/${user}/`)
        .then(res => {
          let s = JSON.parse(res)
          if (s.extra.length) {
            api.say(to, `User ${user} not found.`)
          } else {
            rp(`https://api.ldjam.com/vx/node/feed/${s.node}/authors/item/game?limit=1`).then(res => {
              let s = JSON.parse(res)
              if (s.feed.length) {
                rp(`https://api.ldjam.com/vx/node/get/${s.feed[0].id}/`).then(res => {
                  let s = JSON.parse(res).node[0]
                  api.say(to, `"${s.name}" by ${user}: https://ldjam.com${s.path}`)
                })
              } else {
                api.say(to, `User ${user} has no games.`)
              }
            })
          }
        })
      })
    }
  },
  calc: {
    name: 'calc',
    description: 'Add calculator commands',
    init (api) {
      api.addCommand('rpn', (from, to, msg) => {
        let commands = msg.split(' ')

        let stack = []

        let d = true

        commands.forEach(command => {
          if (!isNaN(parseFloat(command)) && isFinite(command)) {
            stack.push(parseInt(command))
          } else {
            let a = stack.pop()
            let b = stack.pop()
            switch (command) {
              case '+':
                stack.push(a + b)
                break
              case '-':
                stack.push(b - a)
                break
              case '*':
                stack.push(a * b)
                break
              case '/':
                stack.push(b / a)
                break
              case '^':
                stack.push(Math.pow(b, a))
                break
              default:
                api.say(to, `${from}: ${command} isn't an operator`)
                d = false
                break
            }
          }
        })

        if (d) {
          if (stack.length) { api.say(to, `${from}: ${stack[0]}`) } else { api.say(to, `${from}: The stack turned out empty.`) }
        }
      })
    }
  },
  log: {
    name: 'log',
    description: 'Log messages',
    init (api) {
      let log = function (msg, action) {
        if (!action) {
          api.log.info(`${msg.to} <${msg.from}> ${msg.message}`)
        } else {
          api.log.info(`${msg.to} *${msg.from} ${msg.message}`)
        }

        knex('logs').insert({
          to: msg.to,
          from: msg.from,
          message: msg.message,
          action: action,
          posted: new Date()
        }).then()
      }

      api.on('message', msg => log(msg, false))
      api.on('action', msg => log(msg, true))

      api.addCommand('seen', (from, to, args) => {
        if (args.length > 0) {
          knex('logs').select('posted', 'message').where({
            from: args.trim(),
            to: to
          }).orderBy('posted', 'desc').first().then(result => {
            if (result) {
              api.say(to, `${from}: User ${args.trim()} was last seen ${moment(result.posted).fromNow()} saying "${result.message}"`)
            } else {
              api.say(to, `${from}: User ${args.trim()} not found`)
            }
          })
        } else {
          api.say(to, `${from}: Usage: seen <username>`)
        }
      })
    }
  }
}
