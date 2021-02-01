export default (time: number): string => {
    time = Math.round(time / 1000)
    const s = time % 60,
    m = Math.floor((time / 60) % 60),
    h = Math.floor((time / 60 / 60) % 24),
    d = Math.floor(time / 60 / 60 / 24);

    return `${d}D:${h}H:${m}M:${s}S`;
}