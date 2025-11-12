import { GridColDef, GridValueFormatterParams } from "@mui/x-data-grid";
import { toDateLocaleString } from "./utils";
import { StatusRowsDto } from "../types/status-rows.dto";
import { EquipmentTypeKey } from "../types/constants";

const fieldConfig: {
  [key: string]: { name: string; formatter?: (params: GridValueFormatterParams<any>) => string };
} = {
  "device ID": {
    name: "Device ID",
  },
  voltR: {
    name: "전압 R",
    formatter: (params) => `${params.value}V`,
  },
  voltG: {
    name: "전압 G",
    formatter: (params) => `${params.value}V`,
  },
  currR: {
    name: "전류 R (Ad.)",
    formatter: (params) => `${params.value} `,
  },
  currG: {
    name: "전류 G (Ad.)",
    formatter: (params) => `${params.value}`,
  },
  offCurrR: {
    name: "오프 전류 R (Ad.)",
    formatter: (params) => `${params.value} `,
  },
  offCurrG: {
    name: "오프 전류 G (Ad.)",
    formatter: (params) => `${params.value} `,
  },
  temp: {
    name: "온도",
    formatter: (params) => `${params.value}°C`,
  },
  
};

export const createDisplayInfoCols = (): GridColDef[] => {
  const baseCols: GridColDef[] = [
    {
      field: "receive_date",
      headerName: "수신 시간",
      width: 250,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        return toDateLocaleString(new Date(params.value));
      },
    },
   
/*     {
      field: "redWatt",
      headerName: "적색 소비전력",
      flex: 1,
      align: "center",
      headerAlign: "center",
      minWidth: 95,
      valueGetter: ({ row }) => {
        const w = (Number(row["voltR"]) * Number(row["currR"])) / 1000;
        return `${w.toFixed(2)}W`;
      },
    },
    {
      field: "greenWatt",
      headerName: "녹색 소비전력",
      flex: 1,
      align: "center",
      headerAlign: "center",
      minWidth: 95,
      valueGetter: ({ row }) => {
        const w = (Number(row["voltG"]) * Number(row["currG"])) / 1000;
        return `${w.toFixed(2)}W`;
      },
    }, */
  ];

  const displayInfoFields = [
    "device ID",
    "voltR",
    "voltG",
    "currR",
    "currG",
    "offCurrR",
    "offCurrG",
    "temp",
    
  ];

  const additionalCols = displayInfoFields.map<GridColDef>((field) => ({
    field,
    headerName: fieldConfig[field]?.name ?? field,
    flex: 1,
    align: "center",
    headerAlign: "center",
    minWidth: 95,
    valueFormatter: fieldConfig[field]?.formatter,
  }));

  return [...baseCols, ...additionalCols];
};
