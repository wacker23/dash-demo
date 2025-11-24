import { forwardRef, Fragment, Ref, useEffect, useMemo, useState } from 'react';
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
import {createStatusCols} from '../lib/createCols';
import Chart from './Chart';
import { useEquipmentDailyLog, useEquipmentInfo, useEquipmentStatus } from '../lib/useAPI';
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
            height: 'calc(100vh - 200px)',
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

const EquipmentDialog = ({visible, ...props}: Props) => {
  const app = useApp();
  const {mutate, cache} = useSWRConfig();
  const snackbar = useSnackbar();
  const {device, isLoading} = useEquipmentInfo(props.id);
  const {clear: clearDailyLog, dailyLog, loadDailyLog, isReady: isDailyReady, isLoading: isDailyLoading} = useEquipmentDailyLog(props.id);
  const {clear: clearStatusRows,status: statusRows, loadPage} = useEquipmentStatus(props.id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabState, setTabState] = useState(1);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [addressKey, setAddressKey] = useState<string | null>(null);
  const {data: address} = useSWR<AddressDto>(addressKey);
  const statusCols = useMemo(() => (
    device?.equipment_type ? createStatusCols(device.equipment_type) : []
  ), [device]);

  // Calculate all Watt values
  const wattValues = useMemo(() => {
    if (dailyLog.length === 0) return { 
      avgWattR: 0, 
      avgWattG: 0,
      maxWattR: 0,
      maxWattG: 0,
      minWattR: 0,
      minWattG: 0,
      avgWattRPerUnit: 0,
      avgWattGPerUnit: 0
    };

    const validLogs = dailyLog.filter(log => 
      log.voltR && log.voltG && log.ampR && log.ampG
    );

    if (validLogs.length === 0) return { 
      avgWattR: 0, 
      avgWattG: 0,
      maxWattR: 0,
      maxWattG: 0,
      minWattR: 0,
      minWattG: 0,
      avgWattRPerUnit: 0,
      avgWattGPerUnit: 0
    };

    const wattRValues = validLogs.map(log => {
      const ampR = Math.floor(Number(log.ampR) / 10) / 100;
      return Number(log.voltR) * ampR;
    });

    const wattGValues = validLogs.map(log => {
      const ampG = Math.floor(Number(log.ampG) / 10) / 100;
      return Number(log.voltG) * ampG;
    });

    const totalWattR = wattRValues.reduce((sum, watt) => sum + watt, 0);
    const totalWattG = wattGValues.reduce((sum, watt) => sum + watt, 0);

    const maxWattR = Math.max(...wattRValues);
    const maxWattG = Math.max(...wattGValues);
    const minWattR = Math.min(...wattRValues);
    const minWattG = Math.min(...wattGValues);

    const units = device?.units || 1;
    const avgWattRPerUnit = totalWattR / validLogs.length / units;
    const avgWattGPerUnit = totalWattG / validLogs.length / units;

    return {
      avgWattR: Math.round((totalWattR / validLogs.length) * 100) / 100,
      avgWattG: Math.round((totalWattG / validLogs.length) * 100) / 100,
      maxWattR: Math.round(maxWattR * 100) / 100,
      maxWattG: Math.round(maxWattG * 100) / 100,
      minWattR: Math.round(minWattR * 100) / 100,
      minWattG: Math.round(minWattG * 100) / 100,
      avgWattRPerUnit: Math.round(avgWattRPerUnit * 100) / 100,
      avgWattGPerUnit: Math.round(avgWattGPerUnit * 100) / 100
    };
  }, [dailyLog, device]);

  console.log(statusRows)

  const handleClose = async () => {
    // clear state
    clearDailyLog();
    clearStatusRows();
    setIsLoaded(false);
    props.onClose && props.onClose();
  };

  const handlePaginationChange = async ({page}: GridPaginationModel) => {
    if (page > -1) {
      await loadPage(page + 1);
    }
  };

  const handleSearchRange = async () => {
    if (startDate && endDate) {
      if (device && device.statusRange) {
        console.log(startDate, dayjs(device.statusRange.start).format('YYYY-MM-DD'));
        if (device.statusRange.start) {
          const pv = dayjs(device.statusRange.start).format('YYYY-MM-DD');
          if (startDate.isBefore(pv)) {
            snackbar.toast('warning', '조회하는 시작일이 DB에 저장된 시간보다 너무 이릅니다. 수정하세요!!');
            return;
          }
        } else if (device.statusRange.end) {
          const pv = dayjs(device.statusRange.end).format('YYYY-MM-DD');
          if (endDate.isAfter(pv)) {
            snackbar.toast('warning', '조회하는 종료일이 DB에 저장된 시간보다 너무 많습니다. 수정하세요!!');
            return;
          }
        }
      }
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      await loadDailyLog(start, end);
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
      await loadDailyLog();
    })();
  }, [loadDailyLog]);

  useEffect(() => {
    (async () => {
      await loadPage();
    })()
  }, [loadPage]);

  useEffect(() => {
    // 현 시간 기준 실시간 로그가 없다면, 마지막 기록에서 1일치를 보여준다
    if (visible) {
      if (!isLoaded && isDailyReady) {
        if (device && device.status && device.statusRange && dailyLog.length === 0) {
          if (device.statusRange.end) {
            setIsLoaded(true);
            const lastDate = dayjs(device.statusRange.end).format('YYYY-MM-DD');
            loadDailyLog(lastDate, lastDate).then(() => false);
          }
        } else {
          setIsLoaded(dailyLog.length > 0);
        }
      }
    }
  }, [visible, device, dailyLog, isDailyReady, loadDailyLog, isLoaded, startDate, endDate]);

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
            {`장비(${props.id}) 세부 정보`}
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
              {device && device.status && device.status.length > 0 && (
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
                            minDate={dayjs(device.statusRange.start)}
                            maxDate={dayjs(device.statusRange.end)}
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
                            maxDate={dayjs(device.statusRange.end)}
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
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {/* Power Statistics Display Container */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            mt: 7,
            mb: 2,
            px: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 4,
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'nowrap',
              minWidth: 'max-content',
              px: 1,
              justifyContent: 'flex-start'
            }}
          >
            {/* Average Power R */} 
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#728370',
                color: 'white',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1.1 }}>
                평균 전력 R
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.avgWattR} W
              </Typography>
            </Paper>

            {/* Average Power G */}
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#728370',
                color: 'white',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1.1 }}>
                평균 전력 G
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.avgWattG} W
              </Typography>
            </Paper>

            {/* Per-unit average Papers (separate from the main Avg cards) */}
            {device?.units && device.units > 1 && (
              <>
                <Paper sx={{
                  p: 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#5b6b6b',
                  color: '#ffce1b',
                  minWidth: 100,
                  maxWidth: 120,
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.1 }}>
                    평균 전력 R (개당)
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.7rem', sm: '0.85rem' }, mt: 0.25 }}>
                    {wattValues.avgWattRPerUnit} W/개
                  </Typography>
                </Paper>

                <Paper sx={{
                  p: 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#5b6b6b',
                  color: '#ffce1b',
                  minWidth: 100,
                  maxWidth: 120,
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.1 }}>
                    평균 전력 G (개당)
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.7rem', sm: '0.85rem' }, mt: 0.25 }}>
                    {wattValues.avgWattGPerUnit} W/개
                  </Typography>
                </Paper>
              </>
            )}

            {/* Max Power R */}
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#d37073',
                color: 'white',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' }, lineHeight: 1.1 }}>
                MAX 전력 R
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.maxWattR} W
              </Typography>
            </Paper>

            {/* Max Power G */}
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#d37073',
                color: 'white',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' }, lineHeight: 1.1 }}>
                MAX 전력 G
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.maxWattG} W
              </Typography>
            </Paper>

            {/* Min Power R */}
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#90b493',
                color: '#ffce1b',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' }, lineHeight: 1.1 }}>
                MIN 전력 R
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.minWattR} W
              </Typography>
            </Paper>

            {/* Min Power G */}
            <Paper
              sx={{
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#90b493',
                color: '#ffce1b',
                minWidth: 100,
                maxWidth: 100,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" sx={{ opacity: 1, fontSize: { xs: '0.65rem', sm: '0.85rem' }, lineHeight: 1.1 }}>
                MIN 전력 G
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                {wattValues.minWattG} W
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'block',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'none',
            },
            height: 'calc(100vh - 160px)',
            overflow: 'hidden'
          }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ px: 2 }}>
            상세 로그
          </Typography>
          <Box sx={{ height: 'calc(100% - 40px)', px: 2 }}>
            <DataGrid
              columns={statusCols}
              rows={statusRows}
              rowCount={device?.statusCount ?? 0}
              getRowId={row => row['id']}
              sortModel={[{field: 'receive_date', sort: 'desc'}]}
              pageSizeOptions={[100]}
              paginationMode={'server'}
              onPaginationModelChange={handlePaginationChange}
              localeText={{
                noRowsLabel: '수신된 상태 정보가 없습니다.',
              }} />
          </Box>
        </Box>
        <Container
          maxWidth={false}
          sx={{
            display: 'none',
            '@media (min-width: 960px) and (min-height: 640px)': {
              display: 'block',
            },
            height: 'calc(100vh - 140px)',
            overflow: 'hidden'
          }}>
          <Grid container spacing={1} sx={{ height: '100%', mt: 1 }}>
            <Grid item xs={12} sx={{ height: '100%' }}>
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
                  label={'상세 로그'}
                  id={`tab-panel-2`}
                  aria-controls={`tab-panel-2`}
                  value={2} />
              </Tabs>
              <TabPanel value={tabState} index={1}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  상태 그래프
                </Typography>
                <>
                  {!isDailyLoading && (
                    <Chart
                      data={dailyLog}
                      tooltipContent={({active, payload, label}) => {
                        const receive_date = dayjs(label).format('YYYY년 MM월 DD일 HH시 mm분 ss초');
                        const voltR = Number(payload?.find(item => item.dataKey === 'voltR')?.value ?? 0);
                        const voltG = Number(payload?.find(item => item.dataKey === 'voltG')?.value ?? 0);
                        const ampR = Math.floor(Number(payload?.find(item => item.dataKey === 'ampR')?.value ?? 0) / 10) / 100;
                        const ampG = Math.floor(Number(payload?.find(item => item.dataKey === 'ampG')?.value ?? 0) / 10) / 100;
                        const wattR = Math.round(voltR * ampR * 100) / 100;
                        const wattG = Math.round(voltG * ampG * 100) / 100;

                        return (
                          <>
                            {active && payload && payload.length && (
                              <Paper sx={{px: 2, py: 1, backgroundColor: '#202123'}}>
                                <>
                                  {payload.map(item => (
                                    <Fragment key={item.dataKey}>
                                      {String(item.dataKey) === 'tempStat' && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}°C`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('volt') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}V`}
                                        </Typography>
                                      )}
                                      {item.dataKey === 'ampR' && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${ampR}A `}
                                          {`(${wattR} Watts)`}
                                        </Typography>
                                      )}
                                      {item.dataKey === 'ampG' && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${ampG}A `}
                                          {`(${wattG} Watts)`}
                                        </Typography>
                                      )}
                                      {String(item.dataKey).startsWith('duty') && (
                                        <Typography color={item.color} fontWeight={'bold'}>
                                          {`${item.name}: ${item.value}%`}
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
                          yAxisId: 'percent',
                          tickFormatter: value => `${value}%`,
                          domain: [0, 100]
                        },
                        {
                          yAxisId: 'tempAxis',
                          tickFormatter: value => `${value}°C`,
                          domain: [-35, 120],
                        },
                        {
                          yAxisId: 'ampAxis',
                          orientation: 'right',
                          tickFormatter: value => `${Math.floor(value) / 1000}A`,
                          domain: [
                            0,
                            Math.max(...dailyLog.map(item =>
                              Math.max(item.ampR ?? 0, item.ampG ?? 0)
                            )) * 1.2,
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
                        {key: 'tempStat', name: '온도', color: '#ffd700', type: 'monotone', yAxisId: 'tempAxis'},
                        {key: 'voltR', name: '전압 R', color: '#ff6347', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'voltG', name: '전압 G', color: '#32cd32', type: 'monotone', yAxisId: 'voltAxis'},
                        {key: 'ampR', name: '전류 R', color: '#ff4500', type: 'monotone', yAxisId: 'ampAxis'},
                        {key: 'ampG', name: '전류 G', color: '#228b22', type: 'monotone', yAxisId: 'ampAxis'},
                        {key: 'dutyR', name: '듀티비 R', color: '#e9967a', type: 'monotone', yAxisId: 'percent'},
                        {key: 'dutyG', name: '듀티비 G', color: '#20b2aa', type: 'monotone',  yAxisId: 'percent'},
                      ]} />
                  )}
                </>
              </TabPanel>
              <TabPanel value={tabState} index={2}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  상세 로그
                </Typography>
                <Box sx={{ height: 'calc(100% - 40px)' }}>
                  <DataGrid
                    columns={statusCols}
                    rows={statusRows}
                    rowCount={device?.statusCount ?? 0}
                    getRowId={row => row['id']}
                    sortModel={[{field: 'receive_date', sort: 'desc'}]}
                    pageSizeOptions={[100]}
                    paginationMode={'server'}
                    onPaginationModelChange={handlePaginationChange}
                    localeText={{
                      noRowsLabel: '수신된 상태 정보가 없습니다.',
                    }} />
                </Box>
              </TabPanel>
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDialog;
