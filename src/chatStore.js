const EventEmitter = require("events").EventEmitter;

class ChatStore extends EventEmitter {
    constructor() {
        super();
        this.state = {
            messages: [],
            username: ""
        };
    }

    init(username) {
        console.log("Chatstore Username ", username);
        this.emit("initialized", username);
        this.state.username = username;
    }

    getUsername() {
        return this.state.username;
    }

    addMessage(msg) {
        this.state.messages.push(msg);
        this.emit("new-message", msg);
    }

    setTyping(typing) {
        this.state.typing = typing;
        //Emit Event
        if (typing) this.emit("is-typing");
        else this.emit("stopped-typing");
    }

    isTyping() {
        return this.state.typing;
    }
}

module.exports = new ChatStore();