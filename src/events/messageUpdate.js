module.exports.run = (client, oldMessage, newMessage) => {
    if (oldMessage.content === newMessage.content) return;
    client.emit('message', newMessage);
}