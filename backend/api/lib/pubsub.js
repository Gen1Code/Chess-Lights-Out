import Ably from "ably";
import dotenv from "dotenv";

dotenv.config();

export async function publish(channelName, message) {
    const client = new Ably.Realtime(process.env.ABLY_API_KEY);
    await Ably.connection.once('connected');
    const channel = client.channels.get(channelName);
    await channel.publish(message);
    Ably.close();
}

export async function getAuthTokenRequest(userId) {
    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY  });
    const tokenRequest = await ably.auth.createTokenRequest({ clientId: userId });
    return tokenRequest;
}
