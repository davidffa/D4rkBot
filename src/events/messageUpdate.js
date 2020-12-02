module.exports.run = (client, oldMessage, newMessage) => {
    if (oldMessage.content === newMessage.content || oldMessage.edits.length > 3 || (Date.now() - oldMessage.createdTimestamp) / 1000 > 15) return;
    client.emit('message', newMessage);
}