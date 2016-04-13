'use strict';

var streembit = streembit || {};

streembit.DEFS = (function (module) {
    return {
        APP_PORT: 8905,             //  Appliction port
        BOOT_PORT: 32319,           //  Discovery port for the Streembit network
        WS_PORT: 32318,             //  Default Web Socket port
        
        TRANSPORT_TCP: "tcp",       //  TCP/IP
        TRANSPORT_WS: "ws",         //  websocket
        
        PRIVATE_NETWORK: "private",
        PUBLIC_NETWORK: "public",
        
        USER_TYPE_HUMAN: "human",
        USER_TYPE_DEVICE: "device",
        USER_TYPE_SERVICE: "service",
        
        ERR_CODE_SYSTEMERR: 0x1000,
        ERR_CODE_INVALID_CONTACT: 0x1001,
        
        PEERMSG_CALL_WEBRTC: "CALL_WEBRTC",
        PEERMSG_CALL_WEBRTCSS: "CALL_WEBRTCSS", // offer share screen
        PEERMSG_CALL_WEBRTCAA: "CALL_WEBRTCAA", // auto audio call (audio call with screen sharing without prompting the user)
        PEERMSG_FILE_WEBRTC: "FILE_WEBRTC",
        PEERMSG_TXTMSG: "TXTMSG",
        PEERMSG_FSEND: "FSEND",
        PEERMSG_FRECV: "FRECV",
        PEERMSG_FEXIT: "FEXIT",
        
        MSG_TEXT: "text",
        MSG_ADDCONTACT: "addcontact",
        MSG_ACCEPTCONTACT: "acceptcontact",
        MSG_DECLINECONTACT: "declinecontact"
    }

}(streembit.DEFS || {}))

module.exports = streembit.DEFS;