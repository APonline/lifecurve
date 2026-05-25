import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

let socket = null;

export function connectSocket() {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    return socket;
}

export function disconnectSocket() {
    if (!socket) return;

    socket.disconnect();
    socket = null;
}

export function hostJoinRoom({ roomCode, gameState }) {
    const activeSocket = connectSocket();

    activeSocket.emit("host:join", {
        roomCode,
        gameState,
    }, (response) => {
        console.log("Host joined room:", response);
    });
}

export function sendGameState({ roomCode, gameState }) {
    const activeSocket = connectSocket();

    activeSocket.emit("game:state", {
        roomCode,
        gameState,
    });
}

export function joinSocketRoom({ roomCode, player }) {
    const activeSocket = connectSocket();

    activeSocket.emit("player:join", {
        roomCode,
        player,
    });
}

export function sendLobbyState({ roomCode, players }) {
    const activeSocket = connectSocket();

    activeSocket.emit("game:state", {
        roomCode,
        gameState: {
            status: "setup",
            players,
        },
    });
}

export function listenForGameState(callback) {
    const activeSocket = connectSocket();

    activeSocket.off("game:state");
    activeSocket.on("game:state", callback);
}

export function sendGameStart({ roomCode, gameState }) {
    const activeSocket = connectSocket();

    console.log("Sending game:start", {
        roomCode,
        gameState,
    });

    activeSocket.emit(
        "game:start",
        {
            roomCode,
            gameState,
        },
        (response) => {
            console.log("game:start response", response);
        }
    );
}

export function listenForGameStart(callback) {
    const activeSocket = connectSocket();

    activeSocket.off("game:start");
    activeSocket.on("game:start", callback);
}