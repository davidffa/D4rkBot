module.exports.run = (client, _oldMessage, newMessage) => {
    client.emit('message', newMessage);
}