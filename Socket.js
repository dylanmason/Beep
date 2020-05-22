import io from 'socket.io-client';

const socket = io('https://beep.nussman.us/', { transports: ['websocket'] });

export default socket
