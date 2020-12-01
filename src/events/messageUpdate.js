module.exports.run = (client, oldMessage, newMessage) => {
    if (oldMessage.content === newMessage.content || oldMessage.edits.length > 3) return;
    client.emit('message', newMessage);
}