export default (src: string, target: string): number => {
  const res = [];
  let i, j;

  for (i = 0; i <= src.length; i++)
    res.push([i]);

  for (j = 1; j <= target.length; j++)
    res[0].push(j);

  for (i = 1; i <= src.length; i++) {
    for (j = 1; j <= target.length; j++) {
      res[i].push(0);

      if (src[i - 1] === target[j - 1]) {
        res[i][j] = res[i - 1][j - 1];
      } else {
        let min = Math.min(
          res[i - 1][j] + 1,
          res[i][j - 1] + 1
        );

        min = Math.min(
          min,
          res[i - 1][j - 1] + 1
        );
        res[i][j] = min;
      }
    }
  }

  return res[src.length][target.length];
}