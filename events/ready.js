module.exports.run = (client) => {
    console.log("D4rkBot iniciado");
    console.log(`Utilizadores: ${client.users.cache.size} \nServidores: ${client.guilds.cache.size}`)
    client.user.setActivity("D4rkB", {type: "WATCHING"});
}