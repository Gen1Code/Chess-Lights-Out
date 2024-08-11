import Ably from "ably";
import dotenv from "dotenv";
import amqp from "amqplib/callback_api.js";

dotenv.config();

export async function publish(channelName, event, message) {
    const client = new Ably.Realtime(process.env.ABLY_API_KEY);
    const channel = client.channels.get(channelName);
    await channel.publish(event, message);
    client.close();
}

export async function getAuthTokenRequest(userId) {
    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    const capability = { "*": ["subscribe"] };
    const tokenParams = {
        clientId: userId,
        capability: JSON.stringify(capability),
    };
    const tokenRequest = await ably.auth.createTokenRequest(tokenParams);
    return tokenRequest;
}

export function consumeQueue(queueName) {
    return new Promise((resolve, reject) => {
        const url =
            "amqps://" +
            process.env.ABLY_API_KEY +
            "@eu-west-1-a-queue.ably.io:5671/shared";

        amqp.connect(url, (error0, connection) => {
            if (error0) {
                return reject(error0);
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    connection.close();
                    return reject(error1);
                }

                const timer = setTimeout(() => {
                    channel.close(() => {
                        connection.close();
                        resolve(null);
                    });
                }, 300);
                channel.prefetch(1);
                channel.consume(
                    queueName,
                    (msg) => {
                        if (msg !== null) {
                            clearTimeout(timer);
                            const messageContent = msg.content.toString();
                            channel.ack(msg);
                            channel.close(() => {
                                connection.close();
                            });
                            resolve(messageContent);
                        }
                            
                    },
                    {
                        noAck: false,
                    }
                );
            });
        });
    });
}

export async function getMessageFromQueue(queueName) {
    try {
        const message = await consumeQueue(queueName);
        if (message !== null) {
            console.log('Received message:', message);
            return message
        } else {
            console.log('No message received within the timeout period.');
            return null
        }
    } catch (error) {
        console.error('Error consuming queue:', error);
    }
}
