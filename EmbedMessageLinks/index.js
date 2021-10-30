// ported from https://github.com/Juby210/message-link-embed

import { inject, uninject } from '@goosemod/patcher';
import { find, findByProps } from "@goosemod/webpack";
import { FluxDispatcher, React } from "@goosemod/webpack/common";
const { parse } = findByProps('parse', 'parseTopic')
const { getChannel } = findByProps('getChannel', 'getDMFromUserId')
const { getMessage } = findByProps('getMessages')
const { getUserAvatarURL } = findByProps('getUserAvatarURL')
const { get } = findByProps("get","getAPIBaseURL","put","post")
const MessageContent = find(m => m.type && m.type.displayName == 'MessageContent')
const User = find(m => m.prototype && m.prototype.tag)
const Timestamp = find(m => m.prototype && m.prototype.toDate && m.prototype.month)

//const isMLEmbed = e => typeof e?.author?.name[1]?.props?.__mlembed !== 'undefined'
const re = /https?:\/\/([^\s]*\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g

const cache = {}
let lastFetch = 0

async function getMsg(channelId, messageId) {
    let message = getMessage(channelId, messageId) || cache[messageId]
    if (!message) {
        if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500))
        try {
            const data = await get({
                url: Endpoints.MESSAGES(channelId),
                query: {
                    limit: 1,
                    around: messageId
                },
                retries: 2
            })
            lastFetch = Date.now()
            message = data.body.find(m => m.id == messageId)
            if (!message) return
            if (!message.author) return
            message.author = new User(message.author)
            message.timestamp = new Timestamp(message.timestamp)
        } catch(e) { return }
    }
    if (!message.author) return
    cache[messageId] = message
    return message
}

function updateMessageEmbeds(id, cid, embeds) {
    FluxDispatcher.dispatch({ type: 'MESSAGE_UPDATE', message: {
        channel_id: cid,
        guild_id: getChannel(cid).guild_id,
        id, embeds
    }})
}

async function appendEmbed(message) {
    if (message.embeds.length > 0) return;

    const embeds = []
    for (const link of message.content.matchAll(re)) {
        if (!link) continue;
        const linkArray = link[0].toString().split('/')

        const msg = await getMsg(linkArray[5], linkArray[6])
        if (!msg) continue;
        const avatarUrl = getUserAvatarURL(msg.author);
        embeds.push({
            author: {
                proxy_icon_url: avatarUrl,
                icon_url: avatarUrl,
                name: msg.author.toString(), //[ msg.author.tag, React.createElement(() => null, { __mlembed: { ...msg, embedmessage: message } }) ], // hack
                url: link
            },
            color: msg.colorString ? parseInt(msg.colorString.substr(1), 16) : msg.embeds.find(e => e.color)?.color,
            description: msg.content || msg.embeds.find(e => e.description)?.description || '',
            footer: { text: parse(`<#${msg.channel_id}>`) },
            timestamp: msg.timestamp,
            type: 'rich'
        })
    }

    updateMessageEmbeds(message.id, message.channel_id, [ ...embeds, ...message.embeds ])
}



export default {
    goosemodHandlers: {
        onImport: () => {
            inject('mlembed-message', MessageContent, 'type', ([{ message }], res) => {
                if (message.content.match(re)) {
                    const promise = new Promise(() => appendEmbed(message));
                    promise.then(()=>{})
                }
            })
        },
        onRemove: () => {
            uninject('mlembed-message')
        }
    }
}
