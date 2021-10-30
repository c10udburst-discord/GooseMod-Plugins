import { commands, internalMessage } from "@goosemod/patcher";

export default {
    goosemodHandlers: {
        onImport: () => {
            commands.add("token","Get your Discord token.", () => {
              const token = localStorage.getItem("token")?.replace(/\"/g, "")
              internalMessage(token ? 
                `Here\'s your token: ||\`${token}\`||\n**DO NOT SEND THIS TO ANYONE**` 
                : "Unable to get your token. :pensive:")
            },
            [])
        },
        onRemove: () => {
            commands.remove("token");
        }
    }
}
