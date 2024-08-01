import { io } from "socket.io-client";
import config from "@config";

const URL = config.socketUrl;

export const socket = io(URL, {
  autoConnect: false,
});
