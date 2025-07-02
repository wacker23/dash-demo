import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  XAxisProps,
  YAxis,
  YAxisProps,
} from 'recharts';
import {useTheme} from '@mui/material/styles';
import {ValueType} from "recharts/types/component/DefaultTooltipContent";
import {CurveType} from "recharts/types/shape/Curve";
import {useState} from "react";
import dayjs from "dayjs";

type Props = {
  data?: any[];
  XAxis?: XAxisProps;
  YAxis?: YAxisProps[];
  tooltipContent?: (props: TooltipProps<ValueType, string | number>) => JSX.Element;
  lineData: {
    key: string;
    name: string;
    color: string;
    type: CurveType;
    yAxisId?: string | number;
  }[];
};

export default function Chart(props: Props) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [highlightLine, setHighlightLine] = useState<string | null>(null);
  const theme = useTheme();

  const toggleLine = (dataKey: string) => {
    if (hiddenKeys.includes(dataKey)) {
      setHiddenKeys(hiddenKeys.filter(key => key !== dataKey));
    } else {
      setHiddenKeys([...hiddenKeys, dataKey]);
    }
  }

  return (
    <ResponsiveContainer>
      <LineChart
        data={props.data}
        margin={{
          top: 16,
          right: 16,
          bottom: 0,
          left: 24,
        }}>
        <CartesianGrid strokeDasharray={'3 3'} />
        <XAxis
          stroke={theme.palette.text.secondary}
          {...props.XAxis} />
        {props.YAxis?.map(({yAxisId, ...props}) => (
          <YAxis
            {...props}
            key={yAxisId}
            yAxisId={yAxisId}
            style={theme.typography.body2}
            stroke={theme.palette.text.secondary} />
        ))}
        <Tooltip
          content={props.tooltipContent} />
        <Legend onClick={({ dataKey }) => {
          if (typeof dataKey === 'string') toggleLine(dataKey);
          }} />


        {props.lineData.map(({key, name, color, ...props}) => (
          <Line
            key={key}
            hide={hiddenKeys.includes(key)}
            yAxisId={props.yAxisId}
            type={props.type}
            name={name}
            dataKey={key}
            stroke={color}
            strokeWidth={3}
            dot={false} />
        ))}
        <Brush tickFormatter={value => {
          if (props.data && props.XAxis) {
            const obj = props.data[value] as {[key: string]: any};
            return dayjs(obj[String(props.XAxis.dataKey)]).format('MM월 DD일 H시 mm분');
          }
          return value;
        }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
