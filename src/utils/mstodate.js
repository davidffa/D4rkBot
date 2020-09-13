module.exports = function msToDate(time) {
    let s = Math.round(time * 0.001);
    let m = 0, h = 0, d = 0;
    while (s >= 60) {
        m++;
        s -= 60;
    }
    while (m >= 60) {
        h++;
        m -= 60;
    }
    while (h >= 24) {
        d++
        h -= 24;
    }
    return `${d}D:${h}H:${m}M:${s}S`;
}