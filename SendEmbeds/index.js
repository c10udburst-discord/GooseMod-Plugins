import { commands } from "@goosemod/patcher";
import { findByProps } from "@goosemod/webpack";
import { channels } from "@goosemod/webpack/common";

let MessageParser = findByProps("createBotMessage")
let MessageQueue = findByProps("enqueue")

export default {
    goosemodHandlers: {
        onImport: () => {
            commands.add("jsonembed","Send Embeds", (args) => {
                var discordEmbed = null
                try {
                    discordEmbed = JSON.parse(args["json"][0]["text"])
                    if (discordEmbed.color !== undefined
                          && discordEmbed.color.match !== undefined
                          && discordEmbed.color.match(/^#?[0-9A-Z]{6}/gi) !== undefined) {
                          discordEmbed.color = discordEmbed.color.replace(/#/g, "");
                          discordEmbed.color = parseInt(discordEmbed.color, 16);
                      }
                } catch (e) {
                    goosemod.showToast(`Failed to parse your input: ${e}`)
                    return
                }
                try {
                      let channelID = channels.getChannelId();
                      let msg = MessageParser.createBotMessage(channelID, '');
            
                      MessageQueue.enqueue({
                        type: 0,
                        message: {
                          channelId: channelID,
                          content: '',
                          tts: false,
                          nonce: msg.id,
                          embed: discordEmbed
                        }
                      }, r => {
                        if (r.ok !== true) {
                         goosemod.showToast(`Failed to send the message: ${r.body.message}`)
                        }
                      })
                    } catch (e) {
                      goosemod.showToast(`Failed to send the message: ${e}`)
                    }
            },
            [{ name: "json", type: 3, required: true }])
        },
        onRemove: () => {
            commands.remove("jsonembed");
        }
    }
}
