module.exports = function mstohours(duration) {
    duration /= 1000;
    duration = duration.toFixed(0);

    let hours = 0
    let minutes = 0
    let seconds = duration
    while (seconds >= 60) {
        minutes += 1
        seconds -= 60
    }
    while (minutes >= 60) {
        hours += 1
        minutes -= 60
    }
    if (minutes < 10) minutes = `0${minutes}`
    if (seconds < 10) seconds = `0${seconds}`

    if (hours > 0)
        return `${hours}:${minutes}:${seconds}`
    else
        return `${minutes}:${seconds}`
}