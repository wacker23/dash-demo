import {GridColDef, GridValueFormatterParams} from "@mui/x-data-grid";
import {IconButton} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import {toDateLocaleString, toDateString} from "./utils";
import { StatusRowsDto } from '../types/status-rows.dto';
import { EquipmentStatusFields } from './fields';
import { DeviceTypes } from './constants';
import { EquipmentTypeKey } from '../types/constants';

export interface DeviceData {
  id: number;
  type: string;
  manufacturing_date: string;
  order_date: string;
  company?: {name: string};
  location?: {name: string};
  status: {rawData: string, receive_date: string}[];
}
const InstalledAmpValues: Record<string, number> = {
  ampR: 200,
  ampG: 180,
  ampOff: 50,
};


const formatAmpWithInstalled = (fieldKey: string) => (params: GridValueFormatterParams<any>): string => {
  const installed = InstalledAmpValues[fieldKey];
  const current = typeof params.value === 'string' ? params.value.split(',')[0] : params.value;

  if (installed !== undefined && current !== undefined) {
    return ` ${current}mA `;
  }

  return '-';
};

const fieldConfig: { [p: string]: { name: string, formatter?: (params: GridValueFormatterParams<any>) => string } } = {
  voltR: {
    name: '전압 R',
    formatter: (params): string => `${params.value}V`,
  },
  voltG: {
    name: '전압 G',
    formatter: (params): string => `${params.value}V`,
  },
  ampR: {
    name: '전류 R',
    formatter: formatAmpWithInstalled('ampR'),
  },
  ampG: {
    name: '전류 G',
    formatter: formatAmpWithInstalled('ampG'),
  },
  ampOff: {
    name: '전원 Off 전류',
    formatter: formatAmpWithInstalled('ampOff'),
  },
  dutyR: {
    name: '듀티비 R',
    formatter: (params): string =>
      `${params.value}%`,
  },
  dutyG: {
    name: '듀티비 G',
    formatter: (params): string =>
      `${params.value}%`,
  },
  outStat: {
    name: '현재 출력 상태',
    formatter: (params): string => {
      switch (params.value) {
        case 0:
          return 'OFF';
        case 1:
          return '적색';
        case 2:
          return '녹색';
        case 3:
          return '녹색 점멸';
        default:
          return '-';
      }
    }
  },
/*  tempStat: {
  name: '온도 상태',
  formatter: (params): string => {
    const raw = Number(params.value);
    if (isNaN(raw)) return '-';
    const temperature = ((raw - 400) / 10).toFixed(1); // keep 1 decimal place if needed
    return `${temperature}°C`;
  },
}, */

tempStat: {
    name: '온도',
    formatter: (params): string =>
      `${params.value}°C`,
  },

  powerLimit: {
    name: '전원(MAX)',
    formatter: (params): string =>
      `${params.value}W`,
  },
  dirStat: {
    name: '방향',
    formatter: (params): string => {
      const status = params.value * 1;
      switch (status) {
        case 0:
          return '북';
        case 1:
          return '동';
        case 2:
          return '남';
        case 3:
          return '서';
        case 4:
          return '북동';
        case 5:
          return '남동';
        case 6:
          return '남서';
        case 7:
          return '북서';
        default:
          return '-';
      }
    }
  },
  modeStat: {
    name: '동작 모드 상태',
    formatter: (params): string => {
      const status = params.value * 1;
      switch (status) {
        case 0:
        case 1:
          return '정상 모드';
        case 2:
          return '적색->녹색->황색 (100%) 테스트';
        case 3:
          return '적색->녹색->황색 (20%) 테스트';
        case 4:
          return '적색 밝기 테스트';
        case 5:
          return '녹색 밝기 테스트';
        case 6:
          return '황색 밝기 테스트';
        case 7:
          return '데모 모드';
        default:
          return '테스트 모드';
      }
    }
  },
  commStat: {
    name: 'RS485',
    formatter: (params): string =>
      params.value ? 'ON' : 'OFF',
  },
  pubNo: {
    name: '토픽',
  },
  firmwareResetCount: {
    name: '리셋',
  },
  dispErrId: {
    name: '오류 번호',
  },
  dispAbnormalStat: {
    name: '오류ID',
  },
  version: {
    name: '버전',
  },
  timestamp: {
    name: '시간 정보',
  },
};

type Props = {
  onViewStatus?: (id: number, type: string, cols: GridColDef[], rows: StatusRowsDto[]) => void;
}

// Power consumption column definitions - reusable
export const createPowerConsumptionCols = (): GridColDef[] => [
  {
    field: 'greenWatt',
    headerName: '녹색 소비전력',
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    minWidth: 95,
    valueGetter: ({row}) =>{
      const w = Number(row['voltG']) * Number(row['ampG']) / 1000;
      return `${w.toFixed(2)}W`;
    },
  },
  {
    field: 'redWatt',
    headerName: '적색 소비전력',
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    minWidth: 95,
    valueGetter: ({row}) => {
      const w = Number(row['voltR']) * Number(row['ampR']) / 1000;
      return `${w.toFixed(2)}W`;
    },
  },
];

export const createStatusCols = (type: EquipmentTypeKey): GridColDef[] => {
  if (EquipmentStatusFields[type].length === 0) {
    return [];
  }

  const cols = EquipmentStatusFields[type]
    .filter(field => field != 'voltR' && field != 'voltG' && field != 'ampR' && field != 'ampG')
    .filter(field => field !== 'modeStat' && field !== 'outStat')
    .map<GridColDef>((field) => {
      return {
        field,
        headerName: fieldConfig[field]?.name ?? field,
        ...(field === 'timestamp' ? {width: 100} : {flex: 1}),
        align: 'center',
        headerAlign: 'center',
        minWidth: 95,
        valueFormatter: fieldConfig[field]?.formatter,
      };
    });

  return [
    {
      field: 'receive_date',
      headerName: '수신 시간',
      width: 250,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        return toDateLocaleString(new Date(params.value));
      }
    },
    {
      field: 'workingVolt',
      headerName: '작동 전압',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      minWidth: 70,
      valueGetter: ({row}) =>{
        const v = (Number(row["voltR"]) + Number(row["voltG"])) / 2;
        return `${v.toFixed(1)}V`;
      }
       
    },


    {
      field: 'greenWatt',
      headerName: '녹색 소비전력',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      minWidth: 95,
      valueGetter: ({row}) =>{
        const w = Number(row['voltG']) * Number(row['ampG']) / 1000;
        return `${w.toFixed(2)}W`;
      },
    },
    {
      field: 'redWatt',
      headerName: '적색 소비전력',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      minWidth: 95,
      valueGetter: ({row}) => {
        const w = Number(row['voltR']) * Number(row['ampR']) / 1000;
        return `${w.toFixed(2)}W`;
      },
    },
    ...cols,
   /*  {
      field: 'state',
      headerName: '장비 상태',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      valueGetter: ({value}) => value === 'normal' ? '양호' : '불량',
    },
    {
      field: 'abnormal',
      headerName: '데이터 품질',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      valueGetter: ({value}) => !value ? '양호' : '불량',
    } */
  ];
};

export const createDeviceCols = (props: Props): GridColDef<DeviceData>[] => {
  return [
    {
      field: 'id',
      headerName: 'ID',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueGetter: ({value, row: {type}}) => `${type}${value}`,
    },
    {
      field: 'type',
      headerName: '장비 유형',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => DeviceTypes[params.value as EquipmentTypeKey],
    },
    // {
    //   field: 'location',
    //   headerName: '설치 장소',
    //   flex: 1,
    //   align: 'center',
    //   headerAlign: 'center',
    //   valueFormatter: (params) => {
    //     return params.value ? params.value.name : '-';
    //   }
    // },
    // {
    //   field: 'manufacturing_date',
    //   headerName: '제조일',
    //   flex: 1,
    //   align: 'center',
    //   headerAlign: 'center',
    //   valueFormatter: (params) => {
    //     return params.value ? toDateString(new Date(params.value)) : '-';
    //   },
    // },
    // {
    //   field: 'company',
    //   headerName: '주문사',
    //   flex: 1,
    //   align: 'center',
    //   headerAlign: 'center',
    //   valueFormatter: (params) => {
    //     return params.value ? params.value.name : '-';
    //   }
    // },
    {
      field: 'order_date',
      headerName: '설치일',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        return params.value ? toDateString(new Date(params.value)) : '-';
      },
    },
    {
      field: 'detail',
      headerName: '세부 정보',
      sortable: false,
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton
          onClick={() => {
            // let cols: GridColDef[] = [], rows: StatusRows[] = [];
            // if (fields[params.row.type].length > 0) {
            //   cols = createStatusCols(params.row.type);
            //   rows = params.row.status.map(({rawData, receive_date}) =>
            //     rawData.split(',').reduce((obj, value, idx) =>
            //       Object.assign(obj, {[fields[params.row.type][idx]]: value}),
            //       {receive_date: new Date(receive_date)}
            //     ));
            // }
            // props.onViewStatus && props.onViewStatus(params.row.id, params.row.type, cols, rows);
          }}>
          <NotesIcon/>
        </IconButton>
      ),
    }
  ]
};
