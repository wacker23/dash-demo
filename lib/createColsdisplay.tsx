import { GridColDef, GridValueFormatterParams } from "@mui/x-data-grid";
import { toDateLocaleString } from "./utils";
import { StatusRowsDto } from "../types/status-rows.dto";
import { EquipmentTypeKey } from "../types/constants";

const fieldConfig: {
  [key: string]: { name: string; formatter?: (params: GridValueFormatterParams<any>) => string };
} = {
  voltR: {
    name: "전압 R",
    formatter: (params) => `${params.value}V`,
  },
  voltG: {
    name: "전압 G",
    formatter: (params) => `${params.value}V`,
  },
  currR: {
    name: "전류 R",
    formatter: (params) => `${params.value}mA`,
  },
  currG: {
    name: "전류 G",
    formatter: (params) => `${params.value}mA`,
  },
  offCurrR: {
    name: "오프 전류 R",
    formatter: (params) => `${params.value}mA`,
  },
  offCurrG: {
    name: "오프 전류 G",
    formatter: (params) => `${params.value}mA`,
  },
  temp: {
    name: "온도",
    formatter: (params) => `${params.value}°C`,
  },
  commStat: {
    name: "RS485 통신 상태",
    formatter: (params) => (params.value ? "ON" : "OFF"),
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
    {
      field: "workingVolt",
      headerName: "작동 전압",
      flex: 1,
      align: "center",
      headerAlign: "center",
      minWidth: 70,
      valueGetter: ({ row }) => {
        return `${(Number(row["voltR"]) + Number(row["voltG"])) / 2}V`;
      },
    },
    {
      field: "redWatt",
      headerName: "적색 소비전력",
      flex: 1,
      align: "center",
      headerAlign: "center",
      minWidth: 95,
      valueGetter: ({ row }) => {
        return `${(Number(row["voltR"]) * Number(row["currR"])) / 1000}W`;
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
        return `${(Number(row["voltG"]) * Number(row["currG"])) / 1000}W`;
      },
    },
  ];

  const displayInfoFields = [
    "voltR",
    "voltG",
    "currR",
    "currG",
    "offCurrR",
    "offCurrG",
    "temp",
    "commStat",
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
