import { forwardRef, Fragment, Ref, useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppBar, Box,
  Container,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {DataGrid, GridPaginationModel} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import {createDisplayInfoCols} from '../lib/createColsdisplay';
import Chart from './Chart';
import { useEquipmentDisplayInfo, useEquipmentInfo } from '../lib/useAPI';
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, {Dayjs} from "dayjs";
import useSWR, { useSWRConfig } from 'swr';
import { useSnackbar } from '../lib/useSnackbar';
import { useApp } from '../lib/useApp';
import AddressDto from '../types/address.dto';

type Props = {
  visible: boolean;
  onClose?: () => void;
  id: string;
};

type TabPanelProps = {
  children?: JSX.Element | JSX.Element[];
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  return (
    <div
      role={'tabpanel'}
      hidden={props.value !== props.index}
      id={`tab-panel-${props.index}`}>
      {props.value === props.index && (
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 155px)',
          }}>
          {props.children}
        </Paper>
      )}
    </div>
  );
}

const Transition = forwardRef(function Transition(
  props: any,
  ref: Ref<unknown>,
) {
  const {children, ...attr} = props;
  return <Slide direction="up" ref={ref} {...attr}>{children}</Slide>;
})

const EquipmentDisplayDialog = ({visible, ...props}: Props) => {
  const app = useApp();
  const {mutate, cache} = useSWRConfig();
  const snackbar = useSnackbar();
  const {device, isLoading} = useEquipmentInfo(props.id);
  const {clear, displayInfo, load, isLoading: isDisplayLoading} = useEquipmentDisplayInfo(props.id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabState, setTabState] = useState(1);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [addressKey, setAddressKey] = useState<string | null>(null);
  const {data: address} = useSWR<AddressDto>(addressKey);
  const displayInfoCols = useMemo(() => createDisplayInfoCols(), []);

  const handleClose = async () => {
    clear();
    setIsLoaded(false);
    props.onClose && props.onClose();
  };

  const handlePaginationChange = async ({page}: GridPaginationModel) => {
    // Pagination logic if needed
  };

  const loadDisplayInfo = useCallback(async (start?: string, end?: string) => {
    if (start && end) {
      // If you need date range functionality for display info
      await load();
    } else if (props.id.trim() !== '') {
      await load();
    }
  }, [props.id, load]);

  const handleSearchRange = async () => {
    if (startDate && endDate) {
      if (device?.statusRange) {
        if (device.statusRange.start) {
          const pv = dayjs(device.statusRange.start).format('YYYY-MM-DD');
          if (startDate.isBefore(pv)) {
            snackbar.toast('warning', '조회하는 시작일이 DB에 저장된 시간보다 너무 이릅니다. 수정하세요!!');
            return;
          }
        }
        if (device.statusRange.end) {
          const pv = dayjs(device.statusRange.end).format('YYYY-MM-DD');
          if (endDate.isAfter(pv)) {
            snackbar.toast('warning', '조회하는 종료일이 DB에 저장된 시간보다 너무 많습니다. 수정하세요!!');
            return;
          }
        }
      }
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      await loadDisplayInfo(start, end);
    }
  };

  useEffect(() => {
    if (device) {
      setAddressKey(
        `/api/kakao/coord2address?lat=${device.location.latitude}&lng=${device.location.longitude}`
      );
    }
  }, [device]);

  useEffect(() => {
    const filterStart = app.getValue('startDate') || null;
    const filterEnd = app.getValue('endDate') || null;
    setStartDate(!filterStart ? null : dayjs(filterStart));
    setEndDate(!filterEnd ? null : dayjs(filterEnd));
  }, [app]);

  useEffect(() => {
    (async () => {
      await loadDisplayInfo();
    })();
  }, [loadDisplayInfo]);

  useEffect(() => {
    if (visible && displayInfo) {
      setIsLoaded(true);
    }
  }, [visible, displayInfo]);

  return (
    <Dialog
      fullScreen
      open={visible}
      onClose={handleClose}
      TransitionComponent={Transition}>
      <AppBar>
        <Toolbar variant={'dense'}>
          <IconButton
            edge={'start'}
            color={'inherit'}
            onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {`장비(${props.id}) 디스플레이 정보`}
          </Typography>
          <Box sx={{ ml: 2, flexGrow: 1, flexDirection: 'row' }}>
            {device && (
              <Typography variant={'subtitle1'} sx={{ fontSize: { xs: '.75rem', sm: '1rem' } }}>
                {`${device.location.name}`}
                {device.units > 0 && ` (${device.units}개)`}
              </Typography>
            )}
            {address && (
              <Typography sx={{ fontSize: { xs: '.50rem', sm: '.75rem' } }}>
                {`${address.address_name}`}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'none',
              '@media (min-width: 960px) and (min-height: 640px)': {
                display: 'block',
              },
            }}>
            <>
              {device && (
                <Grid container>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Box display={'flex'} alignItems={'center'}>
                        <Paper>
                          <DatePicker
                            sx={{
                              '& .MuiInputBase-input': {
                                py: 0.5,
                                width: 90,
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '1.2rem',
                                '&.MuiInputLabel-outlined': {
                                  lineHeight: '1.1rem',
                                },
                              },
                            }}
                            label={'시작일'}
                            minDate={device.statusRange?.start ? dayjs(device.statusRange.start) : undefined}
                            maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                            value={startDate}
                            onChange={value => {
                              setStartDate(value);
                              if (value) {
                                app.setValue('startDate', value.format('YYYY-MM-DD'));
                              }
                            }} />
                        </Paper>
                        <Box mx={1}>-</Box>
                        <Paper>
                          <DatePicker
                            sx={{
                              '& .MuiInputBase-input': {
                                py: 0.5,
                                width: 90,
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '1.2rem',
                                '&.MuiInputLabel-outlined': {
                                  lineHeight: '1.1rem',
                                },
                              },
                            }}
                            label={'종료일'}
                            minDate={startDate}
                            maxDate={device.statusRange?.end ? dayjs(device.statusRange.end) : undefined}
                            value={endDate}
                            onChange={value => {
                              setEndDate(value);
                              if (value) {
                                app.setValue('endDate', value.format('YYYY-MM-DD'));
                              }
                            }} />
                        </Paper>
                        <IconButton
                          edge={'start'}
                          color={'inherit'}
                          sx={{mx: 1}}
                          onClick={handleSearchRange}>
                          <SearchIcon />
                        </IconButton>
                      </Box>
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            </>
          </Box>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Box
          sx={{
            display: 'block',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'none',
            },
            mt: 5
          }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            디스플레이 정보
          </Typography>
          {displayInfo ? (
            <DataGrid
              columns={displayInfoCols}
              rows={[displayInfo]}
              getRowId={row => row.no}
              pageSizeOptions={[100]}
              localeText={{
                noRowsLabel: '디스플레이 정보가 없습니다.',
              }} />
          ) : (
            <Typography>디스플레이 정보를 불러오는 중입니다...</Typography>
          )}
        </Box>
        <Container
          maxWidth={false}
          sx={{
            display: 'none',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'block',
            }
          }}>
          <Grid container sx={{mt: 5}} spacing={3}>
            <Grid item xs={12}>
              <Tabs
                variant={'fullWidth'}
                value={tabState}
                onChange={(_e, value) => setTabState(value)}>
                <Tab
                  label={'그래프'}
                  id={`tab-panel-1`}
                  aria-controls={`tab-panel-1`}
                  value={1} />
                <Tab
                  label={'상세 정보'}
                  id={`tab-panel-2`}
                  aria-controls={`tab-panel-2`}
                  value={2} />
              </Tabs>
              <TabPanel value={tabState} index={1}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  디스플레이 정보 그래프
                </Typography>
                <>
                  {!isDisplayLoading && displayInfo && (
                    <Chart
                      data={[displayInfo]}
                      tooltipContent={({active, payload, label}) => {
                        const receive_date = dayjs(label).format('YYYY년 MM월 DD일 HH시 mm분 ss초');
                        return (
                          <>
                            {active && payload && payload.length && (
                              <Paper sx={{px: 2, py: 1, backgroundColor: '#202123'}}>
                                <>
                                  {payload.map(item => (
                                    <Fragment key={item.dataKey}>
                                      {String(item.dataKey) === 'temp' && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}°C`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('volt') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}V`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('curr') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}A`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('offCurr') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}A`}
                                        </Typography>
                                      )}
                                    </Fragment>
                                  ))}
                                  <Typography color={'white'}>
                                    {`${receive_date}`}
                                  </Typography>
                                </>
                              </Paper>
                            )}
                          </>
                        );
                      }}
                      XAxis={{
                        dataKey: 'receive_date',
                        tickFormatter: (value: Date) =>
                          `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`,
                      }}
                      YAxis={[ 
                        {
                          yAxisId: 'tempAxis',
                          tickFormatter: value => `${value}°C`,
                          domain: [-35, 120],
                        },
                        {
                          yAxisId: 'currAxis',
                          orientation: 'right',
                          tickFormatter: value => `${value}A`,
                          domain: [
                            0,
                            Math.max(
                              displayInfo.currR ?? 0, 
                              displayInfo.currG ?? 0,
                              displayInfo.offCurrR ?? 0,
                              displayInfo.offCurrG ?? 0
                            ) * 1.2,
                          ]
                        },
                        {
                          yAxisId: 'voltAxis',
                          orientation: 'right',
                          tickFormatter: value => `${value}V`,
                          domain: [24]
                        },
                      ]}
                      lineData={[
                        {key: 'temp', name: '온도', color: '#ffd700', type: 'monotone', yAxisId: 'tempAxis'},
                        {key: 'voltR', name: '전압 R', color: '#ff6347', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'voltG', name: '전압 G', color: '#32cd32', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'currR', name: '전류 R', color: '#ff4500', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'currG', name: '전류 G', color: '#228b22', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'offCurrR', name: '오프 전류 R', color: '#e9967a', type: 'monotone', yAxisId: 'currAxis'},
                        {key: 'offCurrG', name: '오프 전류 G', color: '#20b2aa', type: 'monotone', yAxisId: 'currAxis'},
                      ]} />
                  )}
                </>
              </TabPanel>
              <TabPanel value={tabState} index={2}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  디스플레이 상세 정보
                </Typography>
                {displayInfo ? (
                  <DataGrid
                    columns={displayInfoCols}
                    rows={[displayInfo]}
                    getRowId={row => row.no}
                    pageSizeOptions={[100]}
                    localeText={{
                      noRowsLabel: '디스플레이 정보가 없습니다.',
                    }} />
                ) : (
                  <Typography>디스플레이 정보를 불러오는 중입니다...</Typography>
                )}
              </TabPanel>
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDisplayDialog;
