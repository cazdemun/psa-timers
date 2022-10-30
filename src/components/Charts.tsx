import React, { useEffect, useState } from 'react';
import { addDays, differenceInCalendarDays, format, fromUnixTime, isSameDay, parse } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimerRecord } from '../timerMachine/timerMachine';
import { formatMillisecondsHHmmss } from '../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const simpleRange = (n: number): number[] => [...Array(n).keys()];

export const getRangeDates = (
  since: Date = parse('01/01/2022', 'dd/MM/yyyy', new Date()), to: Date = new Date(),
): Date[] => (
  simpleRange(differenceInCalendarDays(to, since) + 1)
    .map((x) => addDays(since, x))
    .sort((a, b) => a.getTime() - b.getTime())
);

export const TimersByDayChart = ({ timerRecords }: { timerRecords: TimerRecord[] }) => {
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  const options = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
        },

      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Timers history',
      },
    },
  };

  useEffect(() => {
    const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
    if (firstRecording) {
      const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
      const dates = getRangeDates(firstDate, new Date());
      const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
      const dataset = dates
        .map((d) => timerRecords
          .map((x) => fromUnixTime(x.finalTime / 1000))
          .filter((x) => isSameDay(x, d))
          .length);

      setData({
        labels,
        datasets: [
          {
            label: 'Timers done that day',
            data: dataset,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      });
    }
  }, [timerRecords]);

  return (
    <Line options={options} data={data} />
  );
};

type RawDataStrategy = (rawData: TimerRecord[]) => { labels: string[], dataset: number[] }

export const timersPerByDayStrategy: RawDataStrategy = (timerRecords) => {
  const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
  if (firstRecording) {
    const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
    const dates = getRangeDates(firstDate, new Date());
    const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
    const dataset = dates
      .map((d) => timerRecords
        .map((x) => fromUnixTime(x.finalTime / 1000))
        .filter((x) => isSameDay(x, d))
        .length);
    return {
      labels,
      dataset,
    }
  }
  return {
    labels: [],
    dataset: [],
  }
}

export const timeByDayStrategy: RawDataStrategy = (timerRecords) => {
  const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
  if (firstRecording) {
    const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
    const dates = getRangeDates(firstDate, new Date());
    const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
    const dataset = dates
      .map((d) => timerRecords
        .filter((x) => isSameDay(fromUnixTime(x.finalTime / 1000), d))
        .map((x) => x.millisecondsOriginalGoal)
        .reduce((acc, x) => acc + x, 0));
    return {
      labels,
      dataset,
    }
  }
  return {
    labels: [],
    dataset: [],
  }
}

export const averageTimePerTimerByDayStrategy: RawDataStrategy = (timerRecords) => {
  const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
  if (firstRecording) {
    const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
    const dates = getRangeDates(firstDate, new Date());
    const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
    const dataset = dates
      .map((d) => {
        const totalDayTime = timerRecords
          .filter((x) => isSameDay(fromUnixTime(x.finalTime / 1000), d))
          .map((x) => x.millisecondsOriginalGoal)
          .reduce((acc, x) => acc + x, 0);

        const totalTimers = timerRecords
          .map((x) => fromUnixTime(x.finalTime / 1000))
          .filter((x) => isSameDay(x, d))
          .length;
        return totalTimers === 0 ? 0 : Math.floor(totalDayTime / totalTimers);
      });
    return {
      labels,
      dataset,
    }
  }
  return {
    labels: [],
    dataset: [],
  }
}

type CustomChartProps = {
  timerRecords: TimerRecord[]
  rawDataStrategy: RawDataStrategy
  xAxisLabel: string
  borderColor?: string
  backgroundColor?: string,
}

export const CustomHHmmssChartByDay: React.FC<CustomChartProps> = ({
  timerRecords, xAxisLabel, rawDataStrategy, borderColor='rgb(255, 99, 132)', backgroundColor='rgba(255, 99, 132, 0.5)',
}) => {
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor,
        backgroundColor,
      },
    ],
  });

  const options: ChartOptions<"line"> = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
          callback: function (value: any, index: any, ticks: any) {
            return formatMillisecondsHHmmss(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: xAxisLabel,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            console.log(xAxisLabel, context.formattedValue)
            const lbl = `${context.label}: ${formatMillisecondsHHmmss(parseInt(context.formattedValue.replace(',', '')))}`
            console.log(xAxisLabel, lbl)
            return lbl
          },
        },
      },
    },
  };

  useEffect(() => {
    const { labels, dataset } = rawDataStrategy(timerRecords);
    console.log(xAxisLabel, labels, dataset);
    setData({
      labels,
      datasets: [
        {
          label: xAxisLabel,
          data: dataset,
          borderColor,
          backgroundColor,
        },
      ],
    });
  }, [timerRecords, rawDataStrategy, xAxisLabel, backgroundColor, borderColor]);

  return (
    <Line options={options} data={data} />
  );
};
