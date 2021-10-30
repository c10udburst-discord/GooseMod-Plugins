import { commands, internalMessage } from "@goosemod/patcher";
import { findByProps } from "@goosemod/webpack";

const SessionStore = findByProps("getSessions", "getSession")

function getClientEmoji(clientInfo) {
    if (clientInfo === undefined || clientInfo.client === undefined) return ":question:"
    switch (clientInfo.client) {
        case "desktop": return "🖥"
        case "web": return "🌐"
        case "mobile": return "📱"
        default: return clientInfo.client;
    }
}

export default {
    goosemodHandlers: {
        onImport: () => {
            commands.add("sessions","Get your Discord token.", () => {
                const currentSession = SessionStore.getSession()
                let content = []
                for (const session of Object.values(SessionStore.getSessions())) {
                    let isThis = currentSession.sessionId === session.sessionId
                    content.push(`${getClientEmoji(session.clientInfo)} • ${session.status} • ${session.clientInfo.os}${isThis?" • this session":""}`)
                }
                internalMessage({title: "Active Sessions",color: 3908957,description:content.join("\n")})
            },
            [])
        },
        onRemove: () => {
            commands.remove("sessions");
        }
    }
}
