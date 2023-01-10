import React from 'react';
import { formatMillisecondsmmss, mmssToMilliseconds } from '../utils';

const index = [
  "1. Introduction 00:00",
  "2. Presentation 00:47",
  "3. Grid 01:49",
  "4. Setup 02:06",
  "5. Image loading 03:43",
  "6. Premultyplying images 05:45",
  "7. Training 12:27",
  "8. Gradients 14:16",
  "9. Default behavior 15:18",
  "10. Loss spikes 17:07",
  "11. Gradient normalization 18:22",
  "12. Stochastic updates 19:17",
  "13. Batch size 22:07",
  "14. Results 22:39",
  "15. Experiments 23:19",
  "16. Optimization 26:51",
  "17. Growth 29:21",
  "18. Loss 30:21",
  "19. Variant 32:29",
  "20. Conclusion 33:17",
]

type YoutubeCalculatorFormat = {
  originalString: string
  startTimeStampMilliseconds: number,
  durationMilliseconds: number
}

const YoutubeCalculator = () => {
  return (
    <>
      {
        index
          //   .map((s) => s.match(/[0-5]\d:[0-5]\d/) as unknown as string[])
          //   .map((s) => s[0])
          .reduce((acc: YoutubeCalculatorFormat[], s: string, idx: number, arr: string[]) => {
            if (arr.length === idx + 1) {
              const [regexmmss] = s.match(/[0-5]\d:[0-5]\d/) as string[]
              return acc.concat([{
                originalString: s,
                startTimeStampMilliseconds: mmssToMilliseconds(regexmmss),
                durationMilliseconds: 0,
              }]);
            }
            const [nextregexmmss] = arr[idx + 1].match(/[0-5]\d:[0-5]\d/) as string[]
            const nextMilliseconds = mmssToMilliseconds(nextregexmmss);
            const [regexmmss] = s.match(/[0-5]\d:[0-5]\d/) as string[]
            const currentMilliseconds = mmssToMilliseconds(regexmmss);
            const difference = nextMilliseconds - currentMilliseconds;
            return acc.concat([{
              originalString: s,
              startTimeStampMilliseconds: mmssToMilliseconds(regexmmss),
              durationMilliseconds: difference,
            }]);
          }, [])
          .map((s) => <div>{`${s.originalString} (${formatMillisecondsmmss(s.durationMilliseconds)})`}</div>)
      }
    </>
  );
}

export default YoutubeCalculator;
