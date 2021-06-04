const { stripIndents } = require('common-tags')
const { sumBy } = require('lodash')

const parseInput = (stdin) => {
  const lines = stdin.toString().split('\n')
  lines.shift() // Test case ID
  const n = parseInt(lines.shift())
  return {
    map: lines.slice(0, 2 * n).map((s) => [...s].map((c) => parseInt(c))),
    n,
  }
}

const parseOutput = (stdout, n) => {
  const lines = stdout.toString().split('\n')
  const m = parseInt(lines.shift())
  if (isNaN(m)) {
    throw new Error('Invalid Answer: operation count not specified')
  }
  if (m > 10000) {
    throw new Error('Invalid Answer: operation limit exceeded')
  }
  return lines.slice(0, m).map((l) => {
    const arr = l.split(' ')
    if (arr.length !== 3) {
      throw new Error('Invalid Answer: each line must contain 3 entries')
    }
    const ints = arr.map(x => parseInt(x))
    const direction = ints[0]
    if (direction !== 0 && direction !== 1) {
      throw new Error('Invalid Answer: invalid direction')
    }
    const p = ints[1]
    const x = ints[2]
    if (!(x >= 1 && x <= 2 * n)) {
      throw new Error(`Invalid Answer: x out of range, x=${x}, n=${n}`)
    }
    if (!(p >= 0 && p < 2 * n)) {
      throw new Error(`Invalid Answer: p out of range, p=${p}, n=${n}`)
    }
    return {
      direction, x: direction === 0 ? x : p, y: direction === 0 ? p : x,
    }
  })
}

const runStep = (map, n, { direction, x, y }) => {
  let temp
  if (direction === 0) {
    temp = [...map[y]]
    for (let i = 0; i < x; i++) {
      map[y][2 * n + i - x] = temp[i]
    }
    for (let i = x; i < 2 * n; i++) {
      map[y][i - x] = temp[i]
    }
  } else {
    temp = Array(2 * n).fill(0).map((_, i) => map[i][x])
    for (let i = 0; i < y; i++) {
      map[2 * n + i - y][x] = temp[i]
    }
    for (let i = y; i < 2 * n; i++) {
      map[i - y][x] = temp[i]
    }
  }
}

const checkReference = (map, x0, x1, y0, y1, ref) => {
  let count = 0
  for (let i = y0; i < y1; i++) {
    for (let j = x0; j < x1; j++) {
      if (map[i][j] !== ref) {
        count++
      }
    }
  }
  return count
}

const battler = async (execute, { input }) => {
  const stdin = input
  const { map, n } = parseInput(stdin)
  try {
    const { stdout } = await execute(stdin, 0)
    const operations = parseOutput(stdout, n)

    console.log(`before: ${map}`)

    operations.forEach((op) => runStep(map, n, op))

    console.log(`after: ${map}`)

    const i = (checkReference(map, 0, n, 0, n, 1)
      + checkReference(map, n, 2 * n, 0, n, 2)
      + checkReference(map, 0, n, n, 2 * n, 3)
      + checkReference(map, n, 2 * n, n, 2 * n, 4))

    return {
      result: 'settled',
      winner: 0,
      scores: [Math.max(Math.floor(1000 * Math.pow(2, -(10 * i / (n * n))) - operations.length * (20 * 20) / (n * n) * 0.1), 0)],
    }
  } catch (e) {
    console.log(`judge failed: ${e}`)
    console.log(e.stack)
    return {
      result: 'settled',
      winner: 0,
      scores: [0],
    }
  }
}

const cases = [
  stripIndents`1
2
1122
1224
3344
3341
  `,
  stripIndents`2
4
11113433
11114322
11113232
11114443
42333242
34232434
24422324
24324234
  `,
  stripIndents`3
4
21111122
12221212
11211222
12111222
34344443
34343334
44433334
44433334
  `,
  stripIndents`4
4
11112222
11112222
11233244
11444413
33324424
33434432
33124224
33314413
  `,
  stripIndents`5
2
1211
3344
4132
3242
  `,
  stripIndents`6
3
432314
213443
111224
113133
234422
412324
  `,
  stripIndents`7
5
3431324112
3324211423
3214414334
2144414332
2111312232
1442122122
3444334312
2132144142
1433112233
2423143134
`,
  stripIndents`8
7
42131241341424
13432314413433
11444223312132
41121121413343
43431323411124
23334421222324
11211414324211
34132333343413
43434433233413
14221132214343
44122222421124
21222241133412
14422333123211
42414243321422
`,
  stripIndents`9
10
14332133324322431231
22122124214112424434
41234324434144223422
23221311222244311212
33144343331342124423
21414214441421343244
23433143223411434434
42141341441432124222
13132112342312443212
42442243133222214431
22242321311323441134
42233211133312432441
11232213241312332433
23411444143121442143
31134314343141444241
43211111323131231314
13332343212121131414
31443211342332223443
21121331423424414211
23432332312121413313
`,
  stripIndents`10
20
2444244224224233313333233123224124343133
1111243413424412313314113311122324212323
1321334311224312432311213233411412222424
4411311331243222134334434223411211243414
2114123241434124312123124312334434111224
2141313234332231224212221114411221211434
2132142422244142432424114232111113343322
2311113222344243242244344411132442313423
3142323131423433323244413144232444413111
1411133313441444431134241132224132122332
4323132141243441444144413441144121142321
1233442132341431334313112111313223232221
4134233323124313114132243441341443411323
1334214413342243421112232131424123434321
1424214443223244222244242231134331142232
2422342341134244222113322123112412134144
3134142414124123422241323141222411114344
3124241212421224223334444423444134132212
4434133243132133232222341441311313422232
1431224444122124141344334242321224243313
4224433324433213342114241443132341344241
3132432312233112131334311233314142123114
4342331433112442413214212422344434344323
1121211124331121213122134114413134221443
1433233124343433334121113214232324413331
4432321312241133214214211411211312132111
2321133431142233433234421424122232341442
2143322214434342224113432134432334332323
4223323332131111321411243133214144341444
4421243221132122134311131331423411431231
4132414412324413141332411211124242133443
1433443123424331111444224243332433133222
2233343312234342234122123441424433334133
2341231133444143123341221212134133134234
4441324332413131113223244341214412234344
1414242132132412141331412421221244223222
2431141223334213234143344323231341344321
1224233121144221442414122411334234212432
2112231342342211134443321241224114432213
3133113421111423244234431332423122422421
`,
]

const configs = [
  ...Array(10)
    .fill(0)
    .map((_, i) => (
      {
        id: `case-${i + 1}`,
        name: `case ${i + 1}`,
        params: {
          input: cases[i],
        },
      })),
]

const matchConfigs = [
  ...Array(10)
    .fill(0)
    .map((_, i) => ({
      config: `case-${i + 1}`,
      players: [0],
    })),
]

const judgeMatch = (results) => ({
  result: results[0].result,
  winner: results[0].winner,
  scores: [sumBy(results, ({ scores }) => scores[0])],
})

module.exports = {
  parseInput,
  parseOutput,
  battler,
  configs,
  matchConfigs,
  judgeMatch,
}
