let fs = require('fs')
let path = require('path')

let rp = require('request-promise')

module.exports = {
    ideagen: {
        name: 'ideagen',
        description: 'Generate game ideas and names',
        init (api) {
            this.ideasections = require('./ideasections')
            this.names = fs.readFileSync(path.join(__dirname, 'video_game_names.txt'), 'utf8')

            api.addCommand('idea', (from, to, msg) => {
                let part1 = this.ideasections.list1[Math.floor(Math.random()*this.ideasections.list1.length)]
                let part2 = this.ideasections.list2[Math.floor(Math.random()*this.ideasections.list2.length)]
                let part3 = this.ideasections.list3[Math.floor(Math.random()*this.ideasections.list3.length)]

                let n = ''
                if (['a', 'e', 'i', 'o', 'u'].indexOf(part1[0].toLowerCase()) >= 0)
                    n = 'n'

                api.say(to, `Make a${n} ${part1} ${part2} ${part3}!`)
            })

            api.addCommand('name', (from, to, msg) => {
                // List from https://videogamena.me/video_game_names.txt
                let ideas = []
                let similar = {}
                this.names.split('----\n').forEach(idea_parts => {
                    let tmp = []
                    idea_parts.split('\n').forEach(idea_part => {
                        let [idea, similar_parts] = idea_part.split('^')
                        if (similar_parts)
                            similar[idea] = similar_parts.split('|')
                        tmp.push(idea)
                    })

                    ideas.push(tmp)
                })

                let name = []

                ideas.forEach(idea_parts => {
                    let part = idea_parts[Math.floor(Math.random()*idea_parts.length)]
                    if (typeof similar[part] !== 'undefined') {
                        ideas.forEach(idea_parts => {
                            similar[part].forEach(similar => {
                                if (idea_parts.indexOf(similar) >= 0)
                                    idea_parts.splice(idea_parts.indexOf(similar))
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
                if (user === '')
                    user = from 

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
    }
}
