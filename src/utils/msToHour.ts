export default (time: number): string => {
    time = Math.round(time / 1000)
    const s = time % 60,
    m = ~~((time / 60) % 60),
    h = ~~(time / 60 / 60);

    return h
        ? `${String(h).length === 2 ? h : `0${h}`}:${String(m).length === 2 ? m : `0${m}`}:${String(s).length === 2 ? s : `0${s}`}`
        : `${String(m).length === 2 ? m : `0${m}`}:${String(s).length === 2 ? s : `0${s}`}`;
}